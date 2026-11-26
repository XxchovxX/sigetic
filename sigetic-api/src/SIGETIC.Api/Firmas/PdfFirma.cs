using System.Globalization;
using PdfSharp.Drawing;
using PdfSharp.Fonts;
using PdfSharp.Pdf;
using PdfSharp.Pdf.IO;

namespace SIGETIC.Api.Firmas;

internal static class PdfFirma
{
    private static readonly CultureInfo Cultura = CultureInfo.GetCultureInfo("es-CO");
    private static readonly XBrush Verde = new XSolidBrush(XColor.FromArgb(0, 107, 46));

    public static void ConfigurarFuentes() => GlobalFontSettings.FontResolver = new FuentesFirma();

    public static byte[] CrearFormato(Guid id, IReadOnlyList<(SeccionTh122 Seccion, string[][] Filas)> secciones,
        IReadOnlyList<FirmanteDocumento> firmantes, DateTimeOffset creado)
    {
        using var documento = new PdfDocument();
        documento.Info.Title = $"TH-F-122 | {PlantillaTh122.Titulo}";
        using var pagina = new Paginas(documento, "TH-F-122  |  Versión 01  |  Noviembre de 2026", id);
        pagina.Titulo(PlantillaTh122.Titulo);
        pagina.Texto($"Registro generado en SIGETIC el {FechaColombia(creado)}.");

        foreach (var (seccion, filas) in secciones)
        {
            pagina.Subtitulo(seccion.Titulo);
            for (var i = 0; i < filas.Length; i++)
            {
                if (seccion.Repetible)
                    pagina.Etiqueta($"Registro {i + 1}");
                for (var j = 0; j < filas[i].Length; j++)
                {
                    if (filas[i][j].Length > 0)
                        pagina.Campo(seccion.Campos[j].Etiqueta, filas[i][j]);
                }
            }
            if (filas.Length == 0)
                pagina.Texto("Sin registros.");
        }

        pagina.Subtitulo("Personas asignadas para firmar");
        foreach (var firmante in firmantes)
            pagina.Campo(firmante.Rol, $"{firmante.Nombre}{(firmante.Cargo is null ? "" : $" | {firmante.Cargo}")}");
        pagina.Texto("Las firmas y sus fechas se incorporan en la constancia al finalizar el trámite.");
        pagina.Terminar();
        return Exportar(documento);
    }

    public static byte[] Importar(byte[] pdf)
    {
        try
        {
            using var origen = new MemoryStream(pdf);
            using var fuente = PdfReader.Open(origen, PdfDocumentOpenMode.Import);
            if (fuente.PageCount is < 1 or > 100)
                throw new ErrorFirma(400, "Carga un PDF de 1 a 100 páginas.");
            using var copia = new PdfDocument();
            for (var i = 0; i < fuente.PageCount; i++)
            {
                var pagina = copia.AddPage(fuente.Pages[i]);
                pagina.Elements.Remove("/Annots");
                pagina.Elements.Remove("/AA");
            }
            return Exportar(copia);
        }
        catch (Exception error) when (error is not (ErrorFirma or OutOfMemoryException))
        {
            throw new ErrorFirma(400, "No se pudo preparar el PDF. Si está protegido o contiene campos rellenables, exporta una copia para impresión.");
        }
    }

    public static byte[] AgregarConstancia(byte[] pdf, Guid id, DatosDocumento datos)
    {
        using var flujo = new MemoryStream(pdf);
        using var documento = PdfReader.Open(flujo, PdfDocumentOpenMode.Modify);
        using var pagina = new Paginas(documento, datos.Tipo, id);
        pagina.Titulo("Constancia de firma electrónica");
        pagina.Campo("Documento", datos.Titulo);
        pagina.Texto("Firmado electrónicamente por medio de SIGETIC. Cada persona ingresó con su cuenta, aceptó el contenido del documento y confirmó la firma con un código de un solo uso enviado al correo registrado en la plataforma.");
        foreach (var firmante in datos.Firmantes)
        {
            var firma = firmante.Firma!;
            pagina.Subtitulo(firmante.Rol);
            pagina.Campo("Firmante", firma.Nombre);
            if (!string.IsNullOrWhiteSpace(firma.Cargo))
                pagina.Campo("Cargo", firma.Cargo);
            pagina.Campo("Fecha y hora de firma", FechaColombia(firma.FechaUtc));
        }
        pagina.Subtitulo("Verificación en SIGETIC");
        pagina.Campo("Identificador del documento", id.ToString("N"));
        pagina.Campo("Huella SHA-256 de la versión aprobada", datos.Sha256);
        pagina.Texto("Las personas asignadas pueden consultar el registro y cotejar este PDF con la copia archivada en Documentos para firmar.");
        pagina.Terminar();
        return Exportar(documento);
    }

    private static string FechaColombia(DateTimeOffset fecha) =>
        fecha.ToOffset(TimeSpan.FromHours(-5)).ToString("dd/MM/yyyy HH:mm:ss 'UTC−05:00'", Cultura);

    private static byte[] Exportar(PdfDocument documento)
    {
        using var flujo = new MemoryStream();
        documento.Save(flujo, false);
        return flujo.ToArray();
    }

    private sealed class Paginas : IDisposable
    {
        private const double Margen = 48;
        private const double Limite = 780;
        private const double Ancho = 499;
        private readonly PdfDocument documento;
        private readonly string tipo;
        private readonly Guid id;
        private readonly XFont regular = new("SIGETIC", 10);
        private readonly XFont negrita = new("SIGETIC", 10, XFontStyleEx.Bold);
        private readonly XFont encabezado = new("SIGETIC", 16, XFontStyleEx.Bold);
        private XGraphics? grafica;
        private double y;

        public Paginas(PdfDocument documento, string tipo, Guid id)
        {
            this.documento = documento;
            this.tipo = tipo;
            this.id = id;
            AgregarPagina();
        }

        public void Titulo(string texto) { Escribir(texto, encabezado, Verde, 23); y += 9; }
        public void Subtitulo(string texto) { AsegurarEspacio(55); y += 13; Escribir(texto, negrita, Verde, 16); }
        public void Etiqueta(string texto) { AsegurarEspacio(44); Escribir(texto, negrita, XBrushes.Black, 15); }
        public void Texto(string texto) { Escribir(texto, regular, XBrushes.Black, 15); y += 4; }

        public void Campo(string etiqueta, string valor)
        {
            Etiqueta(etiqueta);
            Texto(valor);
        }

        private void Escribir(string texto, XFont letra, XBrush color, double paso)
        {
            foreach (var parrafo in texto.Replace("\r\n", "\n").Replace('\r', '\n').Replace('\t', ' ').Split('\n'))
            {
                var linea = "";
                foreach (var palabra in parrafo.Split(' ', StringSplitOptions.RemoveEmptyEntries))
                {
                    var candidata = linea.Length == 0 ? palabra : $"{linea} {palabra}";
                    if (grafica!.MeasureString(candidata, letra).Width <= Ancho)
                    {
                        linea = candidata;
                        continue;
                    }
                    if (linea.Length > 0)
                        Dibujar(linea);
                    linea = "";
                    var caracteres = StringInfo.GetTextElementEnumerator(palabra);
                    while (caracteres.MoveNext())
                    {
                        var caracter = caracteres.GetTextElement();
                        if (linea.Length > 0 && grafica!.MeasureString(linea + caracter, letra).Width > Ancho)
                        {
                            Dibujar(linea);
                            linea = "";
                        }
                        linea += caracter;
                    }
                }
                Dibujar(linea);
            }

            void Dibujar(string linea)
            {
                AsegurarEspacio(paso);
                grafica!.DrawString(linea, letra, color, new XPoint(Margen, y));
                y += paso;
            }
        }

        private void AsegurarEspacio(double altura)
        {
            if (y + altura > Limite)
                AgregarPagina();
        }

        private void AgregarPagina()
        {
            Terminar();
            var pagina = documento.AddPage();
            pagina.Size = PdfSharp.PageSize.A4;
            grafica = XGraphics.FromPdfPage(pagina);
            grafica.DrawString("Alcaldía de San Carlos de Guaroa | SIGETIC", negrita, Verde, new XPoint(Margen, 43));
            grafica.DrawString(tipo, regular, XBrushes.Black, new XPoint(Margen, 60));
            grafica.DrawString($"{id:N}  |  Página {documento.PageCount}", regular, Verde, new XPoint(Margen, 806));
            y = 94;
        }

        public void Terminar()
        {
            grafica?.Dispose();
            grafica = null;
        }

        public void Dispose() => Terminar();
    }

    private sealed class FuentesFirma : IFontResolver
    {
        public FontResolverInfo ResolveTypeface(string familyName, bool bold, bool italic) =>
            new(bold ? "bold" : "regular");

        public byte[] GetFont(string faceName)
        {
            var bold = faceName == "bold";
            var ruta = OperatingSystem.IsWindows()
                ? Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Fonts), bold ? "arialbd.ttf" : "arial.ttf")
                : "/usr/share/fonts/truetype/dejavu/" + (bold ? "DejaVuSans-Bold.ttf" : "DejaVuSans.ttf");
            return File.ReadAllBytes(ruta);
        }
    }
}
