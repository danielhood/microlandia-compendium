import mongoose from 'mongoose';

const ObservationSchema = new mongoose.Schema({
  researcherName: { type: String, required: true, trim: true },
  commonName: { type: String, required: true, trim: true },
  scientificName: { type: String, required: true, trim: true },
  habitat: { type: String, required: true, trim: true },
  fieldNotes: { type: String, default: '' },
  // Base64-encoded PNG data URL for a simple sketch/image
  imageData: { type: String, default: '' }
}, { timestamps: true });

export const Observation = mongoose.model('Observation', ObservationSchema);
