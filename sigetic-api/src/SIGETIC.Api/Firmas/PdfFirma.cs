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
        pagina.Completar();
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
        pagina.Completar();
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
        private const double LimiteInstitucional = 728;
        private const double Ancho = 499;
        private readonly PdfDocument documento;
        private readonly string tipo;
        private readonly Guid id;
        private readonly int primeraPagina;
        private readonly bool institucional;
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
            primeraPagina = documento.PageCount;
            institucional = tipo.StartsWith("TH-F-122", StringComparison.Ordinal);
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
            if (y + altura > (institucional ? LimiteInstitucional : Limite))
                AgregarPagina();
        }

        private void AgregarPagina()
        {
            Terminar();
            var pagina = documento.AddPage();
            pagina.Size = PdfSharp.PageSize.A4;
            grafica = XGraphics.FromPdfPage(pagina);
            if (institucional)
            {
                y = 143;
                return;
            }
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

        public void Completar()
        {
            Terminar();
            if (!institucional) return;

            const string recursos = "SIGETIC.Api.Firmas.Recursos.";
            var ensamblado = typeof(PdfFirma).Assembly;
            using var escudoBytes = ensamblado.GetManifestResourceStream(recursos + "EscudoAlcaldia.png")!;
            using var pieBytes = ensamblado.GetManifestResourceStream(recursos + "PieAlcaldia.jpg")!;
            using var escudo = XImage.FromStream(escudoBytes);
            using var pie = XImage.FromStream(pieBytes);
            var paginas = documento.PageCount - primeraPagina;
            for (var indice = 0; indice < paginas; indice++)
                DibujarMembrete(documento.Pages[primeraPagina + indice], indice + 1, paginas, escudo, pie);
        }

        private void DibujarMembrete(PdfPage pagina, int numero, int total, XImage escudo, XImage pie)
        {
            const double superior = 42;
            const double alto = 76;
            const double anchoEscudo = 95;
            const double anchoDatos = 159;
            const double anchoTitulo = Ancho - anchoEscudo - anchoDatos;
            const double tituloX = Margen + anchoEscudo;
            const double datosX = tituloX + anchoTitulo;
            using var lienzo = XGraphics.FromPdfPage(pagina, XGraphicsPdfPageOptions.Append);
            var linea = new XPen(XColors.Black, 0.55);
            lienzo.DrawRectangle(linea, Margen, superior, Ancho, alto);
            lienzo.DrawLine(linea, tituloX, superior, tituloX, superior + alto);
            lienzo.DrawLine(linea, datosX, superior, datosX, superior + alto);
            foreach (var separacion in new[] { 15, 30, 60 })
                lienzo.DrawLine(linea, datosX, superior + separacion, Margen + Ancho, superior + separacion);

            const double escudoAncho = 86;
            var escudoAlto = escudoAncho * escudo.PixelHeight / escudo.PixelWidth;
            lienzo.DrawImage(escudo, Margen + (anchoEscudo - escudoAncho) / 2, superior + (alto - escudoAlto) / 2, escudoAncho, escudoAlto);
            var titulo = new[] {
                "FORMATO DE IDENTIFICACIÓN, RETENCIÓN Y",
                "TRANSFERENCIA DEL CONOCIMIENTO",
                "INSTITUCIONAL"
            };
            for (var i = 0; i < titulo.Length; i++)
                lienzo.DrawString(titulo[i], negrita, XBrushes.Black,
                    new XRect(tituloX, superior + 16 + i * 14, anchoTitulo, 14), XStringFormats.Center);

            var datos = new (string Texto, int Y)[] {
                ("CÓDIGO: TH-F-122", 11),
                ("VERSIÓN: 01", 26),
                ("FECHA: NOVIEMBRE DE", 42),
                ("2026", 56),
                ($"PÁGINA: {numero} DE {total}", 72)
            };
            foreach (var (texto, y) in datos)
                lienzo.DrawString(texto, negrita, XBrushes.Black, new XPoint(datosX + 6, superior + y));

            var anchoPagina = pagina.Width.Point;
            var altoPie = anchoPagina * pie.PixelHeight / pie.PixelWidth;
            lienzo.DrawImage(pie, 0, pagina.Height.Point - altoPie, anchoPagina, altoPie);
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
