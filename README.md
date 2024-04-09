Please write a function to identify optimal sell signals for cryptocurrency tokens based on historical price data. The function should incorporate a combination of technical indicators and market trend analysis to predict price downturns accurately. The function should be well-documented, efficient, and adaptable to different market conditions.
in typescript and technicalindicators package.

## Function Requirement Document: Cryptocurrency Sell Signal Indicator

### Objective

Develop a robust function capable of analyzing cryptocurrency token price data to identify optimal sell signals. The function aims to maximize profitability by accurately predicting price peaks before downturns in bear markets and avoiding premature sell signals in bull markets.

### Functional Requirements

1. **Input Specification**:

   - The function must accept a chronological series of token prices as its primary input.

2. **Output Specification**:

   - The output of the function must be a JSON object containing a boolean property `sell`, indicating whether the current price point is an optimal sell signal (`true`) or not (`false`).

3. **Market Condition Analysis**:

   - The function should incorporate a mechanism to assess the current market trend (bullish or bearish) as part of its analysis.
   - This analysis can be based on a simple moving average (SMA) crossover system, with further enhancements as deemed necessary through backtesting.

4. **Indicator Integration**:

   - The function must utilize a combination of technical indicators to identify sell signals, including but not limited to:
     - Relative Strength Index (RSI)
     - Stochastic Oscillator
     - Moving Average Convergence Divergence (MACD)
     - Parabolic SAR
     - Average Directional Index (ADX)
   - The choice and configuration of indicators should be adaptable based on the identified market condition.

5. **Adaptive Thresholds**:

   - Indicator thresholds for signaling a sell must be adaptive, potentially varying with market volatility or trend strength to optimize signal accuracy.

6. **Function signature**:

   - function isSellSignal(data: number[]): { sell: boolean }

7. **Performance Metrics**:

   - Key performance metrics during backtesting should include the hit rate of sell signals (percentage of signals followed by a price downturn), profitability (average profit per sell signal), and the frequency of signals (to assess potential trading costs).

8. **Comments**:
   - The function must be well-commented explaining the logic behind indicator selection, threshold settings, and any market condition adjustments.
