import Foundation
import WebKit
import AppKit
import PDFKit
import CoreGraphics

class PDFEngine: NSObject, NSApplicationDelegate, WKNavigationDelegate {
    var webView: WKWebView!
    let htmlURL: URL
    let outputURL: URL
    let paginate: Bool

    init(htmlURL: URL, outputURL: URL, paginate: Bool = false) {
        self.htmlURL = htmlURL
        self.outputURL = outputURL
        self.paginate = paginate
        super.init()
    }

    func applicationDidFinishLaunching(_ notification: Notification) {
        let config = WKWebViewConfiguration()
        // Standard A4 width at 96 DPI is 794px
        webView = WKWebView(frame: NSRect(x: 0, y: 0, width: 800, height: 1130), configuration: config)
        webView.navigationDelegate = self
        webView.loadFileURL(htmlURL, allowingReadAccessTo: htmlURL.deletingLastPathComponent())
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        // Wait 0.5s for fonts and styles to settle
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            let pdfConfig = WKPDFConfiguration()
            self.webView.createPDF(configuration: pdfConfig) { result in
                switch result {
                case .success(let rawData):
                    if self.paginate {
                        self.sliceToA4(pdfData: rawData, outputURL: self.outputURL)
                    } else {
                        do {
                            try rawData.write(to: self.outputURL)
                            print("SUCCESS: Full-document PDF written to \(self.outputURL.path) (\(rawData.count) bytes)")
                        } catch {
                            print("WRITE ERROR: \(error)")
                        }
                    }
                case .failure(let error):
                    print("PDF CREATION ERROR: \(error)")
                }
                NSApp.stop(nil)
                exit(0)
            }
        }
    }

    func sliceToA4(pdfData: Data, outputURL: URL) {
        guard let doc = PDFDocument(data: pdfData), let sourcePage = doc.page(at: 0) else {
            print("Failed to parse raw PDF for slicing, saving raw directly")
            try? pdfData.write(to: outputURL)
            return
        }

        let sourceBounds = sourcePage.bounds(for: .mediaBox)
        let totalHeight = sourceBounds.height
        let totalWidth = sourceBounds.width
        // A4 ratio 841.89 / 595.28 = 1.4142
        let pageHeight = totalWidth * 1.4142
        let numPages = max(1, Int(ceil(totalHeight / pageHeight)))

        print("Paginating: source \(totalWidth) x \(totalHeight) into \(numPages) A4 pages...")

        let finalDoc = PDFDocument()
        let outData = NSMutableData()
        guard let consumer = CGDataConsumer(data: outData as CFMutableData) else { return }

        var mediaBox = CGRect(x: 0, y: 0, width: totalWidth, height: pageHeight)
        guard let context = CGContext(consumer: consumer, mediaBox: &mediaBox, nil) else { return }

        guard let cgDoc = CGPDFDocument(CGDataProvider(data: pdfData as CFData)!) else { return }
        guard let cgPage = cgDoc.page(at: 1) else { return }

        for i in 0..<numPages {
            context.beginPage(mediaBox: &mediaBox)
            context.saveGState()

            context.clip(to: mediaBox)

            // Calculate shift for slice i
            let yShift = -(totalHeight - CGFloat(i + 1) * pageHeight)
            context.translateBy(x: 0, y: yShift)
            context.drawPDFPage(cgPage)

            context.restoreGState()

            // Draw header and footer
            context.saveGState()
            let font = CTFontCreateWithName("Helvetica" as CFString, 8, nil)
            let attr: [NSAttributedString.Key: Any] = [
                .font: font,
                .foregroundColor: NSColor(white: 0.4, alpha: 1.0)
            ]

            let headerStr = NSAttributedString(string: "CyberGuard AI — Master Architecture & Technical Specification", attributes: attr)
            let footerStr = NSAttributedString(string: "Page \(i + 1) of \(numPages)  |  Confidential & Statutory LEA Forensic Reference", attributes: attr)

            // Header line
            let headerLine = CTLineCreateWithAttributedString(headerStr)
            context.textPosition = CGPoint(x: 40, y: pageHeight - 25)
            CTLineDraw(headerLine, context)

            // Footer line
            let footerLine = CTLineCreateWithAttributedString(footerStr)
            context.textPosition = CGPoint(x: 40, y: 20)
            CTLineDraw(footerLine, context)

            context.restoreGState()

            context.endPage()
        }

        context.closePDF()
        outData.write(to: outputURL, atomically: true)
        print("SUCCESS: Paginated PDF written with \(numPages) pages (\(outData.length) bytes)")
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        print("WEBVIEW FAIL: \(error)")
        NSApp.stop(nil)
        exit(1)
    }
}

let args = CommandLine.arguments
if args.count < 3 {
    print("Usage: generate_pdf <input.html> <output.pdf> [--paginate]")
    exit(1)
}

let paginate = args.contains("--paginate")
let app = NSApplication.shared
app.setActivationPolicy(.accessory)
let delegate = PDFEngine(htmlURL: URL(fileURLWithPath: args[1]), outputURL: URL(fileURLWithPath: args[2]), paginate: paginate)
app.delegate = delegate
app.run()
