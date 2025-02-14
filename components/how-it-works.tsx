import HowItWorksCard from "@/components/how-it-works-card";

export default function HowItWorks() {
  return (
    <section className="text-center py-20" id="como-funciona">
      <h4 className="text-xl font-bold mb-4">
        <span className="text-red-500">#</span> Como funciona?
      </h4>
      <h2 className="text-4xl mb-20">
        Cadastre e começe a importar dados dos seus bancos
      </h2>
      <div className="flex justify-center gap-10">
        <HowItWorksCard
          title="Cadastre"
          description="Digite manualmente seus gastos, ganhos, investimentos, metas, etc."
          image="https://themewagon.github.io/pavo/images/features-icon-4.svg"
        />
        <HowItWorksCard
          title="Automatize"
          description="Importe os extratos dos seus bancos diretamente no app e tenha uma visão ampla."
          image="https://themewagon.github.io/pavo/images/features-icon-5.svg"
        />
        <HowItWorksCard
          title="Analise"
          description="Tenha relatórios completos e setorizados para ter maior controle de onde está seu dinheiro."
          image="https://themewagon.github.io/pavo/images/features-icon-2.svg"
        />
      </div>
    </section>
  );
}
