import {
  NearBindgen,
  near,
  call,
  assert,
  view,
  initialize,
  LookupMap,
  UnorderedMap,
  UnorderedSet,
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
  approved_account_ids: { [accountId: string]: number };
  next_approval_id: number;

  constructor({
    token_id,
    owner_id,
    approved_account_ids,
    next_approval_id,
  }: {
    token_id: number;
    owner_id: AccountId;
    approved_account_ids: { [accountId: string]: number };
    next_approval_id: number;
  }) {
    this.token_id = token_id;
    this.owner_id = owner_id;
    this.approved_account_ids = approved_account_ids; //list of approved account IDs that have access to transfer the token. This maps an account ID to an approval ID
    this.next_approval_id = next_approval_id; //the next approval ID to give out.
  }
}

//Token's information on view method
class JsonToken {
  token_id: string;
  owner_id: AccountId;
  metadata: TokenMetadata;
  approved_account_ids: { [accountId: string]: number };

  constructor({
    token_id,
    owner_id,
    metadata,
    approved_account_ids,
  }: {
    token_id: string;
    owner_id: AccountId;
    metadata: TokenMetadata;
    approved_account_ids: { [accountId: string]: number };
  }) {
    this.token_id = token_id;
    this.owner_id = owner_id;
    this.metadata = metadata;
    this.approved_account_ids = approved_account_ids;
  }
}

////////////////  MAIN CONTRACT  ////////////////
@NearBindgen({ requireInit: true })
export class NFTContract {
  owner_id: AccountId;
  token_id: number;
  tokens_per_owner: LookupMap<string>; //Not in used yet
  token_by_id: LookupMap<Token>;
  token_metadata_by_id: UnorderedMap<TokenMetadata>;
  metadata: ContractMetadata;

  constructor() {
    this.token_id = 0;
    this.owner_id = '';
    this.tokens_per_owner = new LookupMap('');
    this.token_by_id = new LookupMap('');
    this.token_metadata_by_id = new UnorderedMap('');
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
    this.tokens_per_owner = new LookupMap('tokensPerOwner');
    this.token_by_id = new LookupMap('tokenById');
    this.token_metadata_by_id = new UnorderedMap('token_metadata_by_id');
    this.metadata = metadata;
  }

  //Mint NFT
  @call({ payableFunction: true })
  nft_mint({
    token_owner_id,
    metadata,
  }: {
    token_owner_id: AccountId;
    metadata: TokenMetadata;
  }) {
    this.tokens_per_owner.set(this.token_id.toString(), token_owner_id);

    //Create new token struct for NFT
    let token = new Token({
      //Set token id
      token_id: this.token_id,
      //Set owner id
      owner_id: token_owner_id,
      //Set the approved account IDs to the default value (an empty map)
      approved_account_ids: {},
      //Initialize next approval ID = 0
      next_approval_id: 0,
    });

    //Map token with token id
    this.token_by_id.set(this.token_id.toString(), token);

    //Map token metadata with token id
    this.token_metadata_by_id.set(this.token_id.toString(), metadata);

    //Fetch token id
    this.token_id++;
  }

  //Transfer NFT
  @call({ payableFunction: true })
  nft_transfer({
    receiver_id,
    token_id,
    approval_id,
    memo,
  }: {
    receiver_id: AccountId;
    token_id: number;
    approval_id: number;
    memo: string;
  }) {
    //Caller of the method must attach a deposit of 1 yocto??? for security purposes
    assert(
      near.attachedDeposit().toString() === '1',
      'Requires attach an exactly deposit of 1 yocto???'
    );

    //Get function caller
    let msgSender: AccountId = near.predecessorAccountId();

    let token = this.token_by_id.get(token_id.toString()) as Token;

    //Panic if token does not exist
    if (token == null) {
      near.panicUtf8('Token not found !');
    }

    near.log(msgSender);
    near.log(this.owner_id);

    //Make sure if the sender doesn't equal the owner
    assert(token.owner_id == msgSender, 'Token should be owned by the sender');

    //Make sure that the sender isn't sending the token to themselves
    assert(
      token.owner_id != receiver_id,
      'The token owner and the receiver should be different'
    );

    //get the next approval ID if we need a new approval
    let approvalId = token.next_approval_id;

    //check if the account has been approved already for this token
    token.approved_account_ids[receiver_id] = approvalId;

    //increment the token's next approval ID by 1
    token.next_approval_id += 1;

    //Transfer ownership
    this.token_by_id.get(token_id.toString()).owner_id = receiver_id;

    //Create a new token struct
    let newToken = new Token({
      token_id: token_id,
      owner_id: receiver_id,
      approved_account_ids: {},
      next_approval_id: 0,
    });

    //Insert new token into the token_by_id, replacing the old entry
    this.token_by_id.set(token_id.toString(), newToken);

    //Log memo
    if (memo != null) {
      near.log(`Memo: ${memo}`);
    }

    return newToken;
  }

  //Get total count of existing tokens
  @view({})
  get_total_supply() {
    return this.token_id;
  }

  //Get total count of existing tokens of an account
  @view({})
  get_owner_total_supply({ account }: { account: AccountId }): number {
    let tokenCount: number = 0;

    //Loop through all tokens existing in contract to search account's owned tokens
    for (let i = 0; i < this.token_id; i++) {
      if (this.token_by_id.get(i.toString()).owner_id === account) {
        tokenCount++;
      }
    }

    return tokenCount;
  }

  //Get all existing tokens
  @view({})
  get_all_tokens({ from, max }: { from?: number; max?: number }): JsonToken[] {
    var all_tokens = [];

    //Paginate tokens
    let start = from ? from : 0;
    let limit = max ? max : this.token_id;
    let keys = this.token_metadata_by_id.toArray();

    for (let i = start; i < keys.length && i < start + limit; i++) {
      let jsonToken = this.get_nft_detail({ fetchTokenId: keys[i][0] });
      all_tokens.push(jsonToken);
    }

    return all_tokens;
  }

  //Get all owned tokens of a specific account
  @view({})
  get_account_tokens({ account }: { account: AccountId }): JsonToken[] {
    var account_tokens = [];

    let keys = this.token_metadata_by_id.toArray();

    for (let i = 0; i < this.token_id; i++) {
      if (this.token_by_id.get(i.toString()).owner_id === account) {
        let jsonToken = this.get_nft_detail({ fetchTokenId: keys[i][0] });
        account_tokens.push(jsonToken);
      }
    }

    return account_tokens;
  }

  //Get a token's detail via token Id
  @view({})
  get_nft_detail({ fetchTokenId }: { fetchTokenId: string }) {
    let token = this.token_by_id.get(fetchTokenId) as Token;

    assert(token !== null, 'Fetched token does not exist !');

    let metadata = this.token_metadata_by_id.get(fetchTokenId) as TokenMetadata;

    let jsonToken = new JsonToken({
      token_id: fetchTokenId,
      owner_id: token.owner_id,
      metadata: metadata,
      approved_account_ids: {},
    });

    return jsonToken;
  }

  //Get NFT contract's metadata
  @view({})
  get_contract_metadata(): ContractMetadata {
    return this.metadata;
  }
}
