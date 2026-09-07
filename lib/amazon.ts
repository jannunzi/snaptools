export function getAmazonAssociateTag() {
  return process.env.NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG || "yourtag-20";
}

export function amazonProductUrl(asin: string) {
  return `https://www.amazon.com/dp/${asin}?tag=${getAmazonAssociateTag()}`;
}

export const amazonDisclosure =
  "As an Amazon Associate we earn from qualifying purchases.";
