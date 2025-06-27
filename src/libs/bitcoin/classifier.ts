export type FeeRates = {
  economyFeeRate: number // sat/vB - low priority
  standardFeeRate: number // sat/vB - normal
  priorityFeeRate: number // sat/vB - high priority
  currentMempool: number // current mempool fee rate
}

export type CoinSelectionData = {
  availableUTXOs: Unspent.List[]
  dustUTXOs: Unspent.List[]
  confirmedUTXOs: Unspent.List[]
  priorityUTXOs: Unspent.List[]
  unconfirmedUTXOs: Unspent.List[]
  largeUTXOs: Unspent.List[]
  smallUTXOs: Unspent.List[]
  recentUTXOs: Unspent.List[]
  privacyRiskyUTXOs: Unspent.List[]
}

export class UTXOClassifier {
  private feeRates: FeeRates
  private dustThreshold: number
  private largeUTXOThreshold: number
  private minConfirmations: number
  private recentBlocksThreshold: number

  constructor(
    feeRates: FeeRates,
    dustThreshold: number = 546, // standard dust threshold
    largeUTXOThreshold: number = 100000000, // 1 BTC in satoshi
    minConfirmations: number = 6,
    recentBlocksThreshold: number = 6
  ) {
    this.feeRates = feeRates
    this.dustThreshold = dustThreshold
    this.largeUTXOThreshold = largeUTXOThreshold
    this.minConfirmations = minConfirmations
    this.recentBlocksThreshold = recentBlocksThreshold
  }

  /**
   * Classify UTXOs into different categories
   */
  public classifyUTXOs(utxos: Unspent.List[]): CoinSelectionData {
    const result: CoinSelectionData = {
      availableUTXOs: [],
      dustUTXOs: [],
      confirmedUTXOs: [],
      priorityUTXOs: [],
      unconfirmedUTXOs: [],
      largeUTXOs: [],
      smallUTXOs: [],
      recentUTXOs: [],
      privacyRiskyUTXOs: []
    }

    for (const utxo of utxos) {
      // Skip spent UTXOs
      // if (utxo.spent) continue
      if (utxo.reused) continue

      // Basic availability check
      result.availableUTXOs.push(utxo)

      // 1. Dust Classification
      if (this.isDustUTXO(utxo)) {
        result.dustUTXOs.push(utxo)
        continue // Dust UTXOs shouldn't be in other categories
      }

      // 2. Confirmation Status
      if (utxo.confirmations >= this.minConfirmations) {
        result.confirmedUTXOs.push(utxo)
      } else {
        result.unconfirmedUTXOs.push(utxo)
      }

      // 3. Priority Classification
      if (this.isPriorityUTXO(utxo)) {
        result.priorityUTXOs.push(utxo)
      }

      // 4. Size Classification
      if (utxo.amount >= this.largeUTXOThreshold) {
        result.largeUTXOs.push(utxo)
      } else {
        result.smallUTXOs.push(utxo)
      }

      // 5. Recent UTXOs
      if (utxo.confirmations <= this.recentBlocksThreshold) {
        result.recentUTXOs.push(utxo)
      }

      // 6. Privacy Risk Assessment
      if (this.isPrivacyRiskyUTXO(utxo)) {
        result.privacyRiskyUTXOs.push(utxo)
      }
    }

    return result
  }

  /**
   * Calculate statistics for classified UTXOs
   */
  public getClassificationStats(classified: CoinSelectionData) {
    const total = classified.availableUTXOs.length

    return {
      total,
      dust: {
        count: classified.dustUTXOs.length,
        percentage: ((classified.dustUTXOs.length / total) * 100).toFixed(1) + '%'
      },
      confirmed: {
        count: classified.confirmedUTXOs.length,
        percentage: ((classified.confirmedUTXOs.length / total) * 100).toFixed(1) + '%'
      },
      priority: {
        count: classified.priorityUTXOs.length,
        percentage: ((classified.priorityUTXOs.length / total) * 100).toFixed(1) + '%'
      },
      large: {
        count: classified.largeUTXOs.length,
        percentage: ((classified.largeUTXOs.length / total) * 100).toFixed(1) + '%'
      },
      privacyRisky: {
        count: classified.privacyRiskyUTXOs.length,
        percentage: ((classified.privacyRiskyUTXOs.length / total) * 100).toFixed(1) + '%'
      }
    }
  }

  /**
   * Get optimal UTXOs for a specific transaction amount
   */
  public getOptimalUTXOsForAmount(
    classifiedUTXOs: CoinSelectionData,
    targetAmount: number,
    strategy: 'privacy' | 'efficiency' | 'consolidation' = 'efficiency'
  ): Unspent.List[] {
    let candidateUTXOs: Unspent.List[] = []

    // Filter out dust and unconfirmed UTXOs for safety
    candidateUTXOs = classifiedUTXOs.availableUTXOs.filter(
      (utxo) => !classifiedUTXOs.dustUTXOs.includes(utxo) && classifiedUTXOs.confirmedUTXOs.includes(utxo)
    )

    switch (strategy) {
      case 'privacy':
        return this.privacyOptimizedSelection(candidateUTXOs, targetAmount, classifiedUTXOs)

      case 'efficiency':
        return this.efficiencyOptimizedSelection(candidateUTXOs, targetAmount, classifiedUTXOs)

      case 'consolidation':
        return this.consolidationOptimizedSelection(candidateUTXOs, targetAmount, classifiedUTXOs)

      default:
        return this.efficiencyOptimizedSelection(candidateUTXOs, targetAmount, classifiedUTXOs)
    }
  }

  /**
   * Check if UTXO is considered dust
   */
  private isDustUTXO(utxo: Unspent.List): boolean {
    // Calculate cost to spend this UTXO
    const inputSize = this.getInputSize(utxo)
    const costToSpend = inputSize * this.feeRates.standardFeeRate

    // If cost to spend > value, it's dust
    if (costToSpend >= utxo.amount) {
      return true
    }

    // Also check against absolute dust threshold
    return utxo.amount <= this.dustThreshold
  }

  /**
   * Check if UTXO should be prioritized for spending
   */
  private isPriorityUTXO(utxo: Unspent.List): boolean {
    // Priority criteria:

    // 1. Well-confirmed UTXOs
    if (utxo.confirmations >= this.minConfirmations * 2) {
      return true
    }

    // 2. Medium-sized UTXOs (good for most transactions)
    const mediumSizeMin = 50000 // 0.0005 BTC
    const mediumSizeMax = 10000000 // 0.1 BTC
    if (utxo.amount >= mediumSizeMin && utxo.amount <= mediumSizeMax) {
      return true
    }

    // 3. UTXOs that improve privacy (break round numbers)
    if (this.improvesPrivacy(utxo)) {
      return true
    }

    return false
  }

  /**
   * Check if UTXO poses privacy risks
   */
  private isPrivacyRiskyUTXO(utxo: Unspent.List): boolean {
    // Privacy risk factors:

    // 1. Round number amounts (likely change)
    if (this.isRoundNumber(utxo.amount)) {
      return true
    }

    // 2. Very large amounts (might be identifiable)
    if (utxo.amount >= 100000000) {
      // 1+ BTC
      return true
    }

    // 3. Address reuse (if we can detect it)
    // This would require additional address history data

    return false
  }

  /**
   * Check if UTXO amount improves privacy
   */
  private improvesPrivacy(utxo: Unspent.List): boolean {
    // Non-round numbers are better for privacy
    return !this.isRoundNumber(utxo.amount)
  }

  /**
   * Check if amount is a "round number"
   */
  private isRoundNumber(amount: number): boolean {
    // Check if divisible by common round numbers
    const roundFactors = [
      100000000, // 1 BTC
      50000000, // 0.5 BTC
      10000000, // 0.1 BTC
      1000000, // 0.01 BTC
      100000 // 0.001 BTC
    ]

    return roundFactors.some((factor) => amount % factor === 0)
  }

  /**
   * Get input size in virtual bytes for fee calculation
   */
  private getInputSize(utxo: Unspent.List): number {
    // Approximate input sizes for different script types
    // P2WPKH: ~68 vBytes (31 + 41*0.25 witness discount)
    // P2SH-P2WPKH: ~91 vBytes
    // P2PKH: ~148 vBytes

    // For P2WPKH (most common for modern wallets)
    return 68
  }

  /**
   * Privacy-optimized coin selection
   */
  private privacyOptimizedSelection(
    utxos: Unspent.List[],
    targetAmount: number,
    classified: CoinSelectionData
  ): Unspent.List[] {
    // Prefer UTXOs that don't pose privacy risks
    const privacySafeUTXOs = utxos.filter((utxo) => !classified.privacyRiskyUTXOs.includes(utxo))

    // Try to find exact match first
    const exactMatch = privacySafeUTXOs.find((utxo) => utxo.amount === targetAmount)
    if (exactMatch) return [exactMatch]

    // Use multiple smaller UTXOs to avoid creating obvious change
    return this.knapsackSolver(privacySafeUTXOs, targetAmount)
  }

  /**
   * Efficiency-optimized coin selection (minimize fees)
   */
  private efficiencyOptimizedSelection(
    utxos: Unspent.List[],
    targetAmount: number,
    classified: CoinSelectionData
  ): Unspent.List[] {
    // Prefer priority UTXOs first
    const priorityUTXOs = utxos.filter((utxo) => classified.priorityUTXOs.includes(utxo))

    // Single UTXO if possible (lowest fee)
    const singleUTXO = priorityUTXOs.find((utxo) => utxo.amount >= targetAmount)
    if (singleUTXO) return [singleUTXO]

    // Otherwise, minimize number of inputs
    return this.minimizeInputsSelection(utxos, targetAmount)
  }

  /**
   * Consolidation-optimized selection (use many small UTXOs)
   */
  private consolidationOptimizedSelection(
    utxos: Unspent.List[],
    targetAmount: number,
    classified: CoinSelectionData
  ): Unspent.List[] {
    // Prefer smaller UTXOs to consolidate them
    const smallUTXOs = classified.smallUTXOs.filter((utxo) => utxos.includes(utxo))

    // Use as many small UTXOs as reasonable
    let selected: Unspent.List[] = []
    let totalAmount = 0

    // Sort by amount (smallest first)
    const sortedSmall = smallUTXOs.sort((a, b) => a.amount - b.amount)

    for (const utxo of sortedSmall) {
      if (totalAmount >= targetAmount) break
      if (selected.length >= 10) break // Reasonable limit

      selected.push(utxo)
      totalAmount += utxo.amount
    }

    // If not enough, add larger UTXOs
    if (totalAmount < targetAmount) {
      const remaining = targetAmount - totalAmount
      const largerUTXO = utxos
        .filter((utxo) => !selected.includes(utxo))
        .find((utxo) => utxo.amount >= remaining)

      if (largerUTXO) {
        selected.push(largerUTXO)
      }
    }

    return selected
  }

  /**
   * Simple knapsack solver for coin selection
   */
  private knapsackSolver(utxos: Unspent.List[], targetAmount: number): Unspent.List[] {
    // Sort UTXOs by amount (descending)
    const sorted = utxos.sort((a, b) => b.amount - a.amount)

    // Simple greedy approach
    const selected: Unspent.List[] = []
    let totalAmount = 0

    for (const utxo of sorted) {
      if (totalAmount >= targetAmount) break

      selected.push(utxo)
      totalAmount += utxo.amount
    }

    return selected
  }

  /**
   * Minimize number of inputs
   */
  private minimizeInputsSelection(utxos: Unspent.List[], targetAmount: number): Unspent.List[] {
    // Sort by amount (descending) to use fewer, larger UTXOs
    const sorted = utxos.sort((a, b) => b.amount - a.amount)

    const selected: Unspent.List[] = []
    let totalAmount = 0

    for (const utxo of sorted) {
      selected.push(utxo)
      totalAmount += utxo.amount

      if (totalAmount >= targetAmount) break
    }

    return selected
  }
}

// Usage example
const feeRates: FeeRates = {
  economyFeeRate: 5, // 5 sat/vB
  standardFeeRate: 15, // 15 sat/vB
  priorityFeeRate: 50, // 50 sat/vB
  currentMempool: 20 // 20 sat/vB
}

const classifier = new UTXOClassifier(feeRates)

// Example usage
function demonstrateClassification(utxos: Unspent.List[]) {
  console.log('=== UTXO Classification Demo ===')

  const classified = classifier.classifyUTXOs(utxos)
  const stats = classifier.getClassificationStats(classified)

  console.log('Classification Stats:', stats)

  // Example: Get optimal UTXOs for sending 0.01 BTC
  const targetAmount = 1_000_000 // 0.01 BTC in satoshi

  console.log('\n=== Coin Selection for 0.01 BTC ===')

  const efficientSelection = classifier.getOptimalUTXOsForAmount(classified, targetAmount, 'efficiency')
  console.log('Efficient selection:', efficientSelection.length, 'UTXOs')

  const privacySelection = classifier.getOptimalUTXOsForAmount(classified, targetAmount, 'privacy')
  console.log('Privacy selection:', privacySelection.length, 'UTXOs')

  const consolidationSelection = classifier.getOptimalUTXOsForAmount(
    classified,
    targetAmount,
    'consolidation'
  )
  console.log('Consolidation selection:', consolidationSelection.length, 'UTXOs')
}
