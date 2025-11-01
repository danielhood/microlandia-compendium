export interface Observation {
  _id?: string;
  researcherName: string;
  commonName: string;
  scientificName: string;
  habitat: string;
  fieldNotes: string;
  imageData?: string; // base64 PNG data URL
  createdAt?: string;
  updatedAt?: string;
}
