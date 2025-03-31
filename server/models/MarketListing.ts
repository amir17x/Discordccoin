import mongoose, { Schema, Document } from 'mongoose';

// Interface for market listing
export interface IMarketListing extends Document {
  sellerId: string;
  sellerName: string;
  itemId: number;
  itemName: string;
  itemEmoji: string;
  quantity: number;
  price: number;
  description: string;
  listingType: 'regular' | 'black_market';
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
}

// Schema for market listing
const MarketListingSchema: Schema = new Schema({
  sellerId: { 
    type: String, 
    required: true,
    index: true
  },
  sellerName: { 
    type: String, 
    required: true 
  },
  itemId: { 
    type: Number, 
    required: true,
    index: true
  },
  itemName: { 
    type: String, 
    required: true 
  },
  itemEmoji: { 
    type: String, 
    required: true 
  },
  quantity: { 
    type: Number, 
    required: true, 
    min: 1 
  },
  price: { 
    type: Number, 
    required: true, 
    min: 1 
  },
  description: { 
    type: String, 
    default: '' 
  },
  listingType: { 
    type: String, 
    enum: ['regular', 'black_market'], 
    default: 'regular',
    index: true
  },
  active: { 
    type: Boolean, 
    default: true,
    index: true
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  },
  expiresAt: { 
    type: Date, 
    required: true,
    index: true
  }
});

// Create and export the model
const MarketListingModel = mongoose.model<IMarketListing>('MarketListing', MarketListingSchema);
export default MarketListingModel;