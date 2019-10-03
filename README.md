<h1 align="center">
  <a href="https://spacemesh.io"><img width="400" src="https://spacemesh.io/content/images/2019/05/black_logo_hp.png" alt="Spacemesh logo" /></a>
  <p align="center">Smapp - the Spacemesh App 🏦📊</p>
  <p align="center">Full Node UI + Wallet </p>
</h1>

<p align="center">
<a href="https://gitcoin.co/profile/spacemeshos" title="Push Open Source Forward">
    <img src="https://gitcoin.co/static/v2/images/promo_buttons/slice_02.png" width="267px" height="52px" alt="Browse Gitcoin Bounties"/>
</a>
</p>

![](https://github.com/spacemeshos/smapp/blob/develop/design/release_0.4/smapp_wallet_desktop.png)

# Spacemesh 0.1 Reelease Milestone
We are currently finalizing the App and the installer - the artifacts of this repo for the Open Testnet Release. The best resource to understand the app functionalith and capabilities is our [Spacemesh Testnet Guide](http://testnet.spacemesh.io)

# MVP1 Milestone (Complete)
- [Interactive Prototype](https://xd.adobe.com/view/d1d14f8b-4c11-46a9-400b-c0157ecae268-a7e0/?fullscreen)
- [Desktop Specs and Visual Design Guide](https://docs.google.com/presentation/d/1G20T3KSt3iVmTqPJ7x9bljBA--PrPUNOpRNA9klVRSk/edit?usp=sharing)
- [Assets](https://drive.google.com/drive/folders/1OHXb15_5uKHsGGMlm0zQ8LSIMRz9C2E7)
- [Desktop screens specs and flows](https://xd.adobe.com/spec/82a02ed8-aecc-466a-4107-10c94808ade3-f491/)

# Signatures
- [ed25591](https://ed25519.cr.yp.to/) via [tweet-nacl.js](https://github.com/dchest/tweetnacl-js). https://tweetnacl.js.org
- hd key deriviation - BIP32 extension for ed25591 (homebrew)

# Terminology

## Wallet
- Has a user re-nameable friendly name
- Includes one main address by default
- Password protected, can be backed up and restored by users from backup
- Has a distinct encrypted data file in local app store
- User can add additional addresses
- Each user has one wallet by default when setting up the app but advanced users may create additional wallets
- Managed by the Spacemesh App but advanced users may use a CLI wallet that should support same data file and security features

## Address
- A public user identifier
- Used for all transactions
- Has a default re-nameable friendly display name
- Has an immutable public EC key and user has a matching private EC key for his public addresses
- Always part of a specific wallet. Has a unique shareable QR code.

## Full Node
- A spacemesh full p2p node running the Spacemesh blockmesh protocol. Working title for lack of a better agreed name by the team.
- Coinbase Address
- The user configured address for receiving validations awards in a full node
Validator
- The main full node role. Validators are responsible for both creating blocks and agreeing on blocks. Validators are spacemesh miners
- Dashboard
- The app section where users manage a locally running full node

## Spacemesh Coin
- Working title until we defined the final coin name for the testnet timeframe
