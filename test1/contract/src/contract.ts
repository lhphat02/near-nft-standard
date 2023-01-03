import {
  NearBindgen,
  near,
  call,
  view,
  initialize,
  LookupMap,
  UnorderedMap,
} from "near-sdk-js";
import { AccountId } from "near-sdk-js/lib/types";

class Token {
  token_id: number;
  owner_id: AccountId;
  title: string|null; 
  // ex. "Arch Nemesis: Mail Carrier" or "Parcel #5055"
  description: string|null; 
  // free-form description
  media: string|null; 
  // URL to associated media, preferably to decentralized, content-addressed storage
  media_hash: string|null; 
  // Base64-encoded sha256 hash of content referenced by the `media` field. Required if `media` is included.
  copies: number|null; 
  // number of copies of this set of metadata in existence when token was minted.
  issued_at: number|null; 
  // When token was issued or minted, Unix epoch in milliseconds
  expires_at: number|null; 
  // When token expires, Unix epoch in milliseconds
  starts_at: number|null; 
  // When token starts being valid, Unix epoch in milliseconds
  updated_at: number|null; 
  // When token was last updated, Unix epoch in milliseconds
  extra: string|null; 
  // anything extra the NFT wants to store on-chain. Can be stringified JSON.
  reference: string|null; 
  // URL to an off-chain JSON file with more info.
  reference_hash: string|null; 
  // Base64-encoded sha256 hash of JSON from reference field. Required if `reference` is included.

  constructor(
    token_id: number,
    owner_id: AccountId,
    title: string|null,
    description: string|null,
    media: string|null,
    media_hash: string|null,
    copies: number|null,
    issued_at: number|null,
    expires_at: number|null,
    starts_at: number|null,
    updated_at: number|null,
    extra: string|null,
    reference: string|null,
    reference_hash: string|null
  ) {
      (this.token_id = token_id),
      (this.owner_id = owner_id),
      (this.title = title),
      (this.description = description),
      (this.media = media),
      (this.media_hash = media_hash),
      (this.copies =copies),
      (this.issued_at =issued_at),
      (this.expires_at =expires_at),
      (this.starts_at =starts_at),
      (this.updated_at=updated_at),
      (this.extra=extra),
      (this.reference= reference),
      (this.reference_hash =reference_hash)
  }
}

@NearBindgen({requireInit: true})
class NFTContract {
  spec: string;
  // required, essentially a version like "nft-2.0.0", replacing "2.0.0" with the implemented version of NEP-177
  name: string; 
  // required, ex. "Mochi Rising — Digital Edition" or "Metaverse 3"
  symbol: string;
   // required, ex. "MOCHI"
  icon: string|null; 
  // Data URL
  base_uri: string|null;
  // Centralized gateway known to have reliable access to decentralized storage assets referenced by `reference` or `media` URLs
  reference: string|null; 
  // URL to a JSON file with more info
  reference_hash: string|null; 
  // Base64-encoded sha256 hash of JSON from reference field. Required if `reference` is included.
  owner_id: AccountId;
  token_id: number;
  owner_by_id: LookupMap<any>;
  token_by_id: LookupMap<any>;
  constructor() {
    this.token_id = 0;
    this.owner_id = "";
    this.spec = "";
    this.name = "";
    this.symbol = "";
    this.icon = "";
    this.base_uri = "";
    this.reference = "";
    this.reference_hash = "";
    this.owner_by_id = new LookupMap("owner");
    this.token_by_id = new LookupMap("token");
  }

  @initialize({})
  init({ owner_id, prefix }: { owner_id: AccountId; prefix: string }) {
    this.token_id = 0;
    this.owner_id = owner_id;
    this.spec = "1.0.0";
    this.name = "Homework PhatLuu";
    this.symbol = "VBI";
    this.icon = "./icon/ape.svg";
    this.base_uri = "";
    this.reference = ""
    this.reference_hash = "";
    this.owner_by_id = new LookupMap(prefix);
    this.token_by_id = new LookupMap("token");
  }

  @call({}) // token_id = 0
  mint_nft({ token_owner_id, name, description, media_uri, level }) {
    this.owner_by_id.set(this.token_id.toString(), token_owner_id); //{tokenId = 0, 'dangquangvurust.testnet'}

    let token = new Token(
      this.token_id,
      token_owner_id,
      name,
      description,
      media_uri,
      level
    );

    this.token_by_id.set(this.token_id.toString(), token);

    this.token_id++;

    return token;
  }

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
}