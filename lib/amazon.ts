export function getAmazonAssociateTag() {
  return process.env.NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG || "jannunzi04-20";
}

export function amazonProductUrl(asin: string) {
  return `https://www.amazon.com/dp/${asin}?tag=${getAmazonAssociateTag()}`;
}

/** Verified ASIN cover path — real JPEGs for our catalog; 1×1 GIF if Amazon has no art. */
export function amazonCoverUrl(asin: string) {
  return `https://m.media-amazon.com/images/P/${asin}.01.LZZZZZZZ.jpg`;
}

export const amazonDisclosure =
  "As an Amazon Associate we earn from qualifying purchases.";
