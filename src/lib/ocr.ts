import { createWorker, type Worker } from 'tesseract.js'
import { captureCardRegion, upscaleForOcr } from './captureCardFrame'

let worker: Worker | null = null
let workerInit: Promise<Worker> | null = null

export async function ensureOcrWorker(): Promise<Worker> {
  if (worker) return worker
  if (!workerInit) {
    workerInit = createWorker('eng+spa').then((w) => {
      worker = w
      return w
    })
  }
  return workerInit
}

export async function terminateOcrWorker(): Promise<void> {
  if (worker) {
    await worker.terminate()
    worker = null
    workerInit = null
  }
}

export async function recognizeCardFromVideo(
  video: HTMLVideoElement,
  jigFrameEl: HTMLElement,
): Promise<string> {
  const frame = captureCardRegion(video, jigFrameEl)
  if (!frame) {
    throw new Error(
      'No se pudo recortar el marco del jig. Centra la carta en el recuadro.',
    )
  }

  const prepared = upscaleForOcr(frame)
  const ocr = await ensureOcrWorker()
  const { data } = await ocr.recognize(prepared)
  return data.text
}
