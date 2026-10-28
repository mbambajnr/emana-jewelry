import images from "./hero-images.json"
export function heroImageProps(name: keyof typeof images, uploadedImage: string) {
  return uploadedImage === images[name].src ? images[name] : { src: uploadedImage, sizes: "100vw" }
}
