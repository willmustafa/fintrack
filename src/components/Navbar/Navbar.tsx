'use client'

import React, {useEffect, useState} from 'react';
import Image from "next/image";
import styles from './Navbar.module.css'

function Navbar() {
    const [scrolling, setScrolling] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 0) {
                setScrolling(true);
            } else {
                setScrolling(false);
            }
        };

        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    return (
        <header className={scrolling ? `${styles.scrolled} navbar navbar-expand-lg fixed-top` : 'navbar navbar-expand-lg fixed-top'}>
            <div className="container">
                <div className="navbar-header">
                    <Image
                        src="/logo.svg"
                        alt="Logo"
                        width={130}
                        height={50}
                        priority
                    />
                </div>
                <div className="collapse navbar-collapse">
                    <ul className="navbar-nav ms-auto align-items-center">
                        <li className="nav-item">
                            <a className="nav-link" href="#">Home</a>
                        </li>
                        <li className="nav-item">
                            <a className="nav-link" href="#about">Como Funciona</a>
                        </li>
                        <li className="nav-item">
                            <a className="nav-link" href="#features">Recursos</a>
                        </li>
                        <li className="nav-item">
                            <button className={"btn btn-success my-2"}>Comece já!</button>
                        </li>
                    </ul>
                </div>
            </div>
        </header>
    );
}

export default Navbar;