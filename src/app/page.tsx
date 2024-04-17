import React from 'react';
import Navbar from "@/components/Navbar/Navbar";
import Image from "next/image";

function Page() {
    return (
        <div>
            <Navbar />
            <div className="d-flex flex-column">
                <section className="container">
                    <div className="row d-flex justify-content-center align-items-center vh-100">
                        <div className="col-6 d-flex gap-3 flex-column">
                            <h1>Muito mais que um aplicativo de <b>Controle Financeiro</b></h1>
                            <h5>Solução completa para organizar suas finanças, separar dinheiro e alcançar seus objetivos. <br /> E o melhor, é <b>Grátis!</b></h5>
                            <button className="btn btn-success col-4">Quero começar agora!</button>
                        </div>
                        <div className="col-6">
                            <Image
                                src="/images/app_dashboard.png"
                                alt="App Dashboard"
                                width={0}
                                height={0}
                                sizes="100vw"
                                style={{ width: '150%', height: 'auto' }}
                            />
                        </div>
                    </div>
                </section>
                <section className="container my-5 py-5">
                    <div className="text-center">
                        <h6><span className="text-danger">#</span> Como funciona?</h6>
                        <h2>Cadastre e comece a importar dados dos seus bancos</h2>
                        <div className="row d-flex mt-5">
                            <div className="col-4 d-flex flex-column align-content-center">
                                <h4>Cadastre</h4>
                                <p>Digite manualmente seus gastos, ganhos, investimentos, metas, etc.</p>
                            </div>
                            <div className="col-4 d-flex flex-column align-content-center">
                                <h4>Cadastre</h4>
                                <p>Digite manualmente seus gastos, ganhos, investimentos, metas, etc.</p>
                            </div>
                            <div className="col-4 d-flex flex-column align-content-center">
                                <h3>Cadastre</h3>
                                <h5>Digite manualmente seus gastos, ganhos, investimentos, metas, etc.</h5>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

export default Page;