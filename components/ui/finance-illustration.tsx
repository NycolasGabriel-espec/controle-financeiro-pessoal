import styles from './finance-illustration.module.css';

export default function FinanceIllustration() {
  return (
    <div className={styles.scene} aria-hidden="true">
      <div className={styles.orbit} />
      <div className={styles.orbitInner} />

      <div className={styles.balanceCard}>
        <div className={styles.cardHeader}>
          <span className={styles.cardTitle}>VISÃO DO MÊS</span>
          <span className={styles.sampleBadge}>Exemplo ilustrativo</span>
        </div>

        <div className={styles.balance}>
          <span>Saldo do período</span>
          <strong>R$ 2.571,10</strong>
        </div>

        <div className={styles.metrics}>
          <div>
            <span><i className={styles.incomeDot} />Receitas</span>
            <strong>R$ 6.000,00</strong>
          </div>
          <div>
            <span><i className={styles.expenseDot} />Despesas</span>
            <strong>R$ 3.428,90</strong>
          </div>
        </div>

        <svg className={styles.chart} viewBox="0 0 260 62" fill="none">
          <path className={styles.chartGuide} d="M0 15H260M0 36H260M0 57H260" />
          <path className={styles.chartArea} d="M0 53C15 53 18 40 34 42S56 53 72 37 91 43 106 29 126 37 143 22 162 29 182 14 202 23 222 10 244 14 260 4V62H0Z" />
          <path className={styles.chartLine} d="M0 53C15 53 18 40 34 42S56 53 72 37 91 43 106 29 126 37 143 22 162 29 182 14 202 23 222 10 244 14 260 4" />
        </svg>
      </div>

      <div className={styles.goalCard}>
        <div className={styles.goalHeading}>
          <span className={styles.goalIcon}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="8" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="12" cy="12" r="1" />
            </svg>
          </span>
          <div>
            <span className={styles.goalLabel}>SUA PRÓXIMA CONQUISTA</span>
            <strong>Reserva de emergência</strong>
          </div>
        </div>
        <div className={styles.goalProgress}><span /></div>
        <div className={styles.goalAmounts}>
          <span><strong>R$ 2.800</strong> de R$ 10.000</span>
          <strong>28%</strong>
        </div>
      </div>
    </div>
  );
}
