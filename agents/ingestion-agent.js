export async function runIngestionAgent(rawArchive) {
  return rawArchive.map((item, index) => ({
    videoId: `video_${String(index + 1).padStart(3, "0")}`,
    rawId: item.id,
    title: item.title,
    source: item.source,
    savedAt: item.savedAt,
    description: item.description,
    transcript: item.transcript,
    ocr: item.ocr,
    tags: item.tags,
    mergedText: [item.title, item.description, item.transcript, item.ocr, item.tags.join(" ")].join("\n")
  }));
}
