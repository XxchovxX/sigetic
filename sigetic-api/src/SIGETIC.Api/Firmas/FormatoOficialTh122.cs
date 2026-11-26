using System.Diagnostics;
using System.IO.Compression;
using System.Security.Cryptography;
using System.Xml.Linq;

namespace SIGETIC.Api.Firmas;

internal sealed class FormatoOficialTh122(IConfiguration configuration, ILogger<FormatoOficialTh122> logger)
{
    private static readonly XNamespace W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
    private const string HuellaPlantillaV01 = "81CEFEBD390831315EF3E32EBF0A14460ED867BD1A49222A3B661B7C5C06BFB5";
    private string Ruta => configuration["Firmas:PlantillaTh122"] ?? "/app/templates/TH-F-122.docx";

    public bool Instalada => File.Exists(Ruta);

    public async Task InstalarAsync(string? base64, CancellationToken ct)
    {
        if (base64 is null || base64.Length > 180_000)
            throw new ErrorFirma(400, "Selecciona el Word oficial del TH-F-122 versión 01.");
        byte[] contenido;
        try { contenido = Convert.FromBase64String(base64); }
        catch (FormatException) { throw new ErrorFirma(400, "El archivo de la plantilla es inválido."); }
        if (!Convert.ToHexString(SHA256.HashData(contenido)).Equals(HuellaPlantillaV01, StringComparison.Ordinal))
            throw new ErrorFirma(400, "El archivo no coincide con la plantilla institucional de referencia.");

        var archivo = Path.GetFullPath(Ruta);
        var carpeta = Path.GetDirectoryName(archivo)!;
        var temporal = Path.Combine(carpeta, $".th122-{Guid.NewGuid():N}");
        try
        {
            Directory.CreateDirectory(carpeta);
            await File.WriteAllBytesAsync(temporal, contenido, ct);
            File.Move(temporal, archivo, overwrite: true);
        }
        catch (Exception error) when (error is IOException or UnauthorizedAccessException)
        {
            logger.LogError(error, "No fue posible instalar la plantilla oficial TH-F-122.");
            throw new ErrorFirma(503, "El servidor no pudo guardar la plantilla institucional.");
        }
        finally
        {
            if (File.Exists(temporal))
                File.Delete(temporal);
        }
    }

    public async Task<byte[]> CrearAsync(IReadOnlyList<(SeccionTh122 Seccion, string[][] Filas)> secciones,
        IReadOnlyList<FirmanteDocumento> firmantes, CancellationToken ct)
    {
        var plantilla = Ruta;
        if (!Instalada)
            throw new ErrorFirma(503, "La plantilla institucional TH-F-122 aún no está instalada.");

        var carpeta = Directory.CreateTempSubdirectory("sigetic-th122-");
        try
        {
            const string nombre = "TH-F-122";
            var word = Path.Combine(carpeta.FullName, nombre + ".docx");
            File.Copy(plantilla, word);
            Diligenciar(word, secciones, firmantes);
            var pdf = Path.Combine(carpeta.FullName, nombre + ".pdf");
            var inicio = new ProcessStartInfo(configuration["Firmas:LibreOffice"] ?? "libreoffice")
            {
                UseShellExecute = false, RedirectStandardOutput = true, RedirectStandardError = true
            };
            foreach (var arg in new[] { "-env:UserInstallation=" + new Uri(Path.Combine(carpeta.FullName, "perfil")).AbsoluteUri,
                         "--headless", "--convert-to", "pdf:writer_pdf_Export", "--outdir", carpeta.FullName, word })
                inicio.ArgumentList.Add(arg);
            using var proceso = Process.Start(inicio) ?? throw new InvalidOperationException("No inició el conversor.");
            using var tiempo = CancellationTokenSource.CreateLinkedTokenSource(ct);
            tiempo.CancelAfter(TimeSpan.FromSeconds(45));
            var stdout = proceso.StandardOutput.ReadToEndAsync();
            var stderr = proceso.StandardError.ReadToEndAsync();
            try
            {
                await proceso.WaitForExitAsync(tiempo.Token);
            }
            catch (OperationCanceledException)
            {
                if (!proceso.HasExited)
                    proceso.Kill(entireProcessTree: true);
                await proceso.WaitForExitAsync(CancellationToken.None);
                throw;
            }
            await Task.WhenAll(stdout, stderr);
            if (proceso.ExitCode != 0 || !File.Exists(pdf))
                throw new InvalidOperationException($"No se generó el PDF institucional (salida {proceso.ExitCode}).");
            return await File.ReadAllBytesAsync(pdf, ct);
        }
        catch (Exception error) when (!ct.IsCancellationRequested &&
            error is IOException or InvalidOperationException or System.ComponentModel.Win32Exception or OperationCanceledException or System.Xml.XmlException)
        {
            logger.LogError(error, "No fue posible generar el TH-F-122 oficial.");
            throw new ErrorFirma(503, "No se pudo generar el PDF con la plantilla institucional TH-F-122.");
        }
        finally
        {
            try { carpeta.Delete(recursive: true); }
            catch (IOException) { logger.LogWarning("No se pudo limpiar la carpeta temporal del TH-F-122."); }
            catch (UnauthorizedAccessException) { logger.LogWarning("No se pudo limpiar la carpeta temporal del TH-F-122."); }
        }
    }

    public static void Diligenciar(string word, IReadOnlyList<(SeccionTh122 Seccion, string[][] Filas)> secciones,
        IReadOnlyList<FirmanteDocumento> firmantes)
    {
        using var paquete = ZipFile.Open(word, ZipArchiveMode.Update);
        var entrada = paquete.GetEntry("word/document.xml") ?? throw new InvalidDataException("El DOCX no tiene documento principal.");
        XDocument xml;
        using (var flujo = entrada.Open())
            xml = XDocument.Load(flujo, LoadOptions.PreserveWhitespace);
        var cuerpo = xml.Root?.Element(W + "body") ?? throw new InvalidDataException("El DOCX no tiene cuerpo.");
        var tablas = cuerpo.Elements(W + "tbl").ToArray();
        if (tablas.Length != 8 || secciones.Count != 8 ||
            Texto(tablas[0].Elements(W + "tr").First()) != "CampoInformación por registrar" ||
            Texto(tablas[7].Elements(W + "tr").First()) != "ENTREGA EL CONOCIMIENTORECIBE EL CONOCIMIENTO")
            throw new InvalidDataException("La estructura no coincide con el TH-F-122 versión 01.");

        FilaVertical(tablas[0], secciones[0].Filas.Single());
        for (var i = 1; i < 4; i++)
            Filas(tablas[i], secciones[i].Filas, secciones[i].Seccion.Campos.Length);
        FilaVertical(tablas[4], secciones[4].Filas.SingleOrDefault() ?? new string[4], conservarPregunta: true);
        Filas(tablas[5], secciones[5].Filas, secciones[5].Seccion.Campos.Length);
        Filas(tablas[6], secciones[6].Filas, secciones[6].Seccion.Campos.Length);

        var recomendaciones = tablas[7].ElementsBeforeSelf(W + "p").Last();
        var recomendacion = secciones[7].Filas.SingleOrDefault()?.FirstOrDefault() ?? "";
        AgregarTexto(recomendaciones, recomendacion);

        var rubricas = tablas[7].Elements(W + "tr").Skip(1).ToArray();
        for (var i = 0; i < firmantes.Count; i++)
        {
            if (!string.IsNullOrWhiteSpace(firmantes[i].Nombre))
                AgregarTexto(rubricas[1].Elements(W + "tc").ElementAt(i).Elements(W + "p").Last(), "  " + firmantes[i].Nombre);
            if (!string.IsNullOrWhiteSpace(firmantes[i].Cargo))
                AgregarTexto(rubricas[2].Elements(W + "tc").ElementAt(i).Elements(W + "p").Last(), "  " + firmantes[i].Cargo);
        }

        entrada.Delete();
        using var destino = paquete.CreateEntry("word/document.xml", CompressionLevel.Optimal).Open();
        xml.Save(destino, SaveOptions.DisableFormatting);
    }

    private static string Texto(XElement nodo) => string.Concat(nodo.Descendants(W + "t").Select(t => t.Value));

    private static void FilaVertical(XElement tabla, string[] valores, bool conservarPregunta = false)
    {
        var filas = tabla.Elements(W + "tr").Skip(1).ToArray();
        if (filas.Length != valores.Length)
            throw new InvalidDataException("La tabla fija del TH-F-122 no tiene el número esperado de filas.");
        for (var i = 0; i < filas.Length; i++)
            LlenarCelda(filas[i].Elements(W + "tc").ElementAt(1), valores[i], conservarPregunta);
    }

    private static void Filas(XElement tabla, string[][] valores, int columnas)
    {
        var ejemplos = tabla.Elements(W + "tr").Skip(1).ToArray();
        if (ejemplos.Length == 0 || ejemplos[0].Elements(W + "tc").Count() != columnas)
            throw new InvalidDataException("La tabla del TH-F-122 no coincide con sus campos.");
        foreach (var valoresFila in valores.DefaultIfEmpty(new string[columnas]))
        {
            var nueva = new XElement(ejemplos[0]);
            var celdas = nueva.Elements(W + "tc").ToArray();
            for (var i = 0; i < columnas; i++)
                LlenarCelda(celdas[i], valoresFila[i] ?? "", false);
            ejemplos[0].AddBeforeSelf(nueva);
        }
        foreach (var ejemplo in ejemplos)
            ejemplo.Remove();
    }

    private static void LlenarCelda(XElement celda, string valor, bool conservarPregunta)
    {
        var parrafos = celda.Elements(W + "p").ToArray();
        var estilo = parrafos.LastOrDefault(p => p.Descendants(W + "r").Any()) ?? parrafos.First();
        var propiedades = estilo.Element(W + "pPr");
        var respuesta = new XElement(W + "p", propiedades is null ? null : new XElement(propiedades));
        var formato = estilo.Descendants(W + "rPr").LastOrDefault();
        AgregarTexto(respuesta, valor ?? "", formato);
        if (conservarPregunta)
        {
            foreach (var run in celda.Descendants(W + "r").Where(r =>
                         (string?)r.Element(W + "rPr")?.Element(W + "color")?.Attribute(W + "val") == "EE0000").ToArray())
                run.Remove();
            foreach (var vacio in parrafos.Where(p => string.IsNullOrWhiteSpace(Texto(p))))
                vacio.Remove();
        }
        else
            foreach (var p in parrafos)
                p.Remove();
        celda.Add(respuesta);
    }

    private static void AgregarTexto(XElement parrafo, string valor, XElement? origen = null)
    {
        var propiedades = origen is null ? new XElement(W + "rPr",
            new XElement(W + "rFonts", new XAttribute(W + "ascii", "Arial Narrow"), new XAttribute(W + "hAnsi", "Arial Narrow")),
            new XElement(W + "sz", new XAttribute(W + "val", "24"))) : new XElement(origen);
        propiedades.Elements(W + "color").Remove();
        propiedades.Add(new XElement(W + "color", new XAttribute(W + "val", "000000")));
        var run = new XElement(W + "r", propiedades);
        foreach (var (linea, i) in valor.Replace("\r\n", "\n").Replace('\r', '\n').Split('\n').Select((v, i) => (v, i)))
        {
            if (i > 0) run.Add(new XElement(W + "br"));
            run.Add(new XElement(W + "t", new XAttribute(XNamespace.Xml + "space", "preserve"), linea));
        }
        parrafo.Add(run);
    }
}
