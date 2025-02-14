import { Button } from "@heroui/button";

export default function HomeHeader() {
  return (
    <header
      id="header"
      className="header py-20 text-center md:pt-24 lg:text-left xl:pt-16 xl:pb-16"
    >
      <div className="px-4 sm:px-8 lg:grid lg:grid-cols-2 lg:gap-x-8">
        <div className="mb-16 lg:mt-32 xl:mt-40 xl:mr-12">
          <h1 className="h1-large mb-5">
            Muito mais do que um aplicativo de <b>Controle Financeiro</b>
          </h1>
          <p className="p-large mb-8">
            Solução completa para organizar suas finanças, separar dinheiro e
            alcançar seus objetivos. E o melhor, é <b>Grátis!</b>
          </p>
          <Button color="success" size="lg" radius="md" className="text-white">
            <b>Quero começar agora!</b>
          </Button>
        </div>
        <div className="xl:text-right">
          <img
            className="inline"
            src="https://themewagon.github.io/pavo/images/header-smartphone.png"
            alt="alternative"
          />
        </div>
      </div>
    </header>
  );
}
