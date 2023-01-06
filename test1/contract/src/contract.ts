import {
  NearBindgen,
  near,
  call,
  assert,
  view,
  initialize,
  LookupMap,
  UnorderedMap,
} from 'near-sdk-js';
import { AccountId } from 'near-sdk-js/lib/types';

// NFTContract's Metadata structure
class ContractMetadata {
  spec: string;
  name: string;
  symbol: string;
  icon?: string;
  base_uri?: string;
  reference?: string;
  reference_hash?: string;

  constructor({
    spec,
    name,
    symbol,
    icon,
    baseUri,
    reference,
    referenceHash,
  }: {
    spec: string;
    name: string;
    symbol: string;
    icon?: string;
    baseUri?: string;
    reference?: string;
    referenceHash?: string;
  }) {
    this.spec = spec; // required, essentially a version like "nft-1.0.0"
    this.name = name; // required, ex. "Mosaics"
    this.symbol = symbol; // required, ex. "MOSAIC"
    this.icon = icon; // Data URL
    this.base_uri = baseUri; // Centralized gateway known to have reliable access to decentralized storage assets referenced by `reference` or `media` URLs
    this.reference = reference; // URL to a JSON file with more info
    this.reference_hash = referenceHash; // Base64-encoded sha256 hash of JSON from reference field. Required if `reference` is included.
  }
}

// Token's Metadata structure
class TokenMetadata {
  title?: string;
  description?: string;
  media?: string;
  media_hash?: string;
  copies?: number;
  issued_at?: string;
  expires_at?: string;
  starts_at?: string;
  updated_at?: string;
  extra?: string;
  reference?: string;
  reference_hash?: string;
  constructor({
    title,
    description,
    media,
    mediaHash,
    copies,
    issuedAt,
    expiresAt,
    startsAt,
    updatedAt,
    extra,
    reference,
    referenceHash,
  }: {
    title?: string;
    description?: string;
    media?: string;
    mediaHash?: string;
    copies?: number;
    issuedAt?: string;
    expiresAt?: string;
    startsAt?: string;
    updatedAt?: string;
    extra?: string;
    reference?: string;
    referenceHash?: string;
  }) {
    this.title = title; // ex. "Arch Nemesis: Mail Carrier" or "Parcel #5055"
    this.description = description; // free-form description
    this.media = media; // URL to associated media, preferably to decentralized, content-addressed storage
    this.media_hash = mediaHash; // Base64-encoded sha256 hash of content referenced by the `media` field. Required if `media` is included.
    this.copies = copies; // number of copies of this set of metadata in existence when token was minted.
    this.issued_at = issuedAt; // ISO 8601 datetime when token was issued or minted
    this.expires_at = expiresAt; // ISO 8601 datetime when token expires
    this.starts_at = startsAt; // ISO 8601 datetime when token starts being valid
    this.updated_at = updatedAt; // ISO 8601 datetime when token was last updated
    this.extra = extra; // anything extra the NFT wants to store on-chain. Can be stringified JSON.
    this.reference = reference; // URL to an off-chain JSON file with more info.
    this.reference_hash = referenceHash; // Base64-encoded sha256 hash of JSON from reference field. Required if `reference` is included.
  }
}

// Token's structure
class Token {
  token_id: number;
  owner_id: AccountId;

  constructor(token_id: number, owner_id: AccountId) {
    (this.token_id = token_id), (this.owner_id = owner_id);
  }
}

//Token's information on view method
class JsonToken {
  token_id: number;
  owner_id: AccountId;
  metadata: TokenMetadata;

  constructor({
    tokenId,
    ownerId,
    metadata,
  }: {
    tokenId: number;
    ownerId: AccountId;
    metadata: TokenMetadata;
  }) {
    //token ID
    (this.token_id = tokenId),
      //owner of the token
      (this.owner_id = ownerId),
      //token metadata
      (this.metadata = metadata);
  }
}

////////////////  MAIN CONTRACT  ////////////////
@NearBindgen({ requireInit: true })
export class NFTContract {
  owner_id: AccountId;
  token_id: number;
  owner_by_id: LookupMap<string>;
  token_by_id: LookupMap<Token>;
  tokenMetadataById: UnorderedMap<TokenMetadata>;
  metadata: ContractMetadata;

  constructor() {
    this.token_id = 0;
    this.owner_id = '';
    this.owner_by_id = new LookupMap('');
    this.token_by_id = new LookupMap('');
    this.tokenMetadataById = new UnorderedMap('');
    this.metadata = { name: '', spec: '', symbol: '' };
  }

  //Initialize values
  @initialize({})
  init({
    owner_id,

    //temporary metadata
    metadata = {
      spec: 'nft-1.0.0',
      name: 'Phat Luu NFT Contract',
      symbol: 'VBI',
    },
  }: {
    owner_id: AccountId;
    metadata: ContractMetadata;
  }) {
    this.token_id = 0;
    this.owner_id = owner_id;
    this.owner_by_id = new LookupMap('ownerById');
    this.token_by_id = new LookupMap('tokenById');
    this.tokenMetadataById = new UnorderedMap('tokenMetadataById');
    this.metadata = metadata;
  }

  //Mint NFT function
  @call({})
  mint_nft({
    token_owner_id,
    metadata,
  }: {
    token_owner_id: AccountId;
    metadata: TokenMetadata;
  }) {
    this.owner_by_id.set(this.token_id.toString(), token_owner_id);

    let token = new Token(this.token_id, token_owner_id);

    this.token_by_id.set(this.token_id.toString(), token);

    this.tokenMetadataById.set(this.token_id.toString(), metadata);

    this.token_id++;
  }

  @call({})
  nft_transfer({
    receiver_id,
    token_id,
  }: {
    receiver_id: string;
    token_id: string;
  }) {}

  @view({})
  get_token_by_id({ token_id }: { token_id: number }) {
    let token = this.token_by_id.get(token_id.toString());

    if (token === null) {
      return null;
    }

    return token;
  }

  @view({})
  get_supply_tokens() {
    return this.token_id;
  }

  @view({})
  get_all_tokens({ start, max }: { start?: number; max?: number }) {
    var all_tokens = [];

    for (var i = 0; i < this.token_id; i++) {
      all_tokens.push(this.token_by_id.get(i.toString()));
    }

    return all_tokens;
  }

  @view({})
  contract_metadata(): ContractMetadata {
    return this.metadata;
  }
}
