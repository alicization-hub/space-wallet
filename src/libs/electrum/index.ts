import { type ConnectionOptions } from 'tls'

import { Client } from './client'

/**
 * @link https://electrumx.readthedocs.io/en/latest/protocol-basics.html
 */
export class ElectrsClient extends Client {
  constructor(protocol: 'tcp' | 'tls' = 'tcp', host: string, port: number, options?: ConnectionOptions) {
    super(protocol, host, port, options)
  }

  onClose(): void {
    super.onClose()
  }

  blockchainAddressGetProof(address: string): Promise<any> {
    return this.request('blockchain.address.get_proof', [address])
  }

  blockchainScripthashGetBalance(scripthash: string): Promise<any> {
    return this.request('blockchain.scripthash.get_balance', [scripthash])
  }

  blockchainScripthashGetHistory(scripthash: string): Promise<any> {
    return this.request('blockchain.scripthash.get_history', [scripthash])
  }

  blockchainScripthashGetMempool(scripthash: string): Promise<any> {
    return this.request('blockchain.scripthash.get_mempool', [scripthash])
  }

  blockchainScripthashListunspent(scripthash: string): Promise<any> {
    return this.request('blockchain.scripthash.listunspent', [scripthash])
  }

  blockchainEstimatefee(number: number): Promise<any> {
    return this.request('blockchain.estimatefee', [number])
  }

  blockchainTransactionBroadcast(rawtx: string): Promise<any> {
    return this.request('blockchain.transaction.broadcast', [rawtx])
  }

  blockchainTransactionGet(tx_hash: string, verbose?: boolean): Promise<any> {
    return this.request('blockchain.transaction.get', [tx_hash, verbose ?? false])
  }

  mempoolGetFeeHistogram(): Promise<any> {
    return this.request('mempool.get_fee_histogram', [])
  }
}
