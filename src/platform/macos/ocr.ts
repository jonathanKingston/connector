/**
 * macOS OCR using the Vision framework via a Swift script.
 */

import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeFile, unlink } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { exec } from "../../helpers/exec.js";
import type { OcrResult, OcrOptions } from "../types.js";

export async function extractText(options: OcrOptions = {}): Promise<OcrResult[]> {
  // First capture a screenshot (reuse screencapture)
  const tmpPath = join(tmpdir(), `ocr-${randomUUID()}.png`);

  try {
    const captureArgs: string[] = ["-x"];
    if (options.region) {
      const r = options.region;
      captureArgs.push("-R", `${r.x},${r.y},${r.width},${r.height}`);
    }
    if (options.displayId !== undefined) {
      captureArgs.push("-D", String(options.displayId));
    }
    captureArgs.push(tmpPath);

    await exec("/usr/sbin/screencapture", captureArgs);

    // Run OCR using the Vision framework via a Swift script
    const languagesLine = options.languages
      ? `request.recognitionLanguages = [${options.languages.map((l) => `"${l}"`).join(", ")}]`
      : "";

    const swiftScript = `
import Foundation
import Vision
import AppKit

let imagePath = CommandLine.arguments[1]
guard let image = NSImage(contentsOfFile: imagePath),
      let cgImage = image.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
    print("[]")
    exit(0)
}

let request = VNRecognizeTextRequest()
request.recognitionLevel = .accurate
${languagesLine}

let handler = VNImageRequestHandler(cgImage: cgImage)
try handler.perform([request])

var results: [[String: Any]] = []
for observation in request.results ?? [] {
    guard let candidate = observation.topCandidates(1).first else { continue }
    let box = observation.boundingBox
    let imgWidth = Double(cgImage.width)
    let imgHeight = Double(cgImage.height)
    results.append([
        "text": candidate.string,
        "confidence": candidate.confidence,
        "bounds": [
            "x": box.origin.x * imgWidth,
            "y": (1 - box.origin.y - box.height) * imgHeight,
            "width": box.width * imgWidth,
            "height": box.height * imgHeight
        ]
    ])
}

let json = try JSONSerialization.data(withJSONObject: results)
print(String(data: json, encoding: .utf8)!)
`;

    const swiftPath = join(tmpdir(), `ocr-${randomUUID()}.swift`);
    await writeFile(swiftPath, swiftScript);

    try {
      const { stdout } = await exec("swift", [swiftPath, tmpPath], 30_000);
      return JSON.parse(stdout.trim() || "[]");
    } finally {
      await unlink(swiftPath).catch(() => {});
    }
  } finally {
    await unlink(tmpPath).catch(() => {});
  }
}
