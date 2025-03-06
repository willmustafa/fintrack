"use client";

import { ForwardRefExoticComponent, RefAttributes, SVGProps } from "react";
import Image from "next/image";
import { Home } from "iconoir-react";
import LogoSmall from "@/public/logo-small.png";
import Logo from "@/assets/logo.svg";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { LogOut } from "lucide-react";

interface SidebarLinkProps {
  path: string;
  name: string;
  icon?: ForwardRefExoticComponent<
    Omit<SVGProps<SVGSVGElement>, "ref"> & RefAttributes<SVGSVGElement>
  >;
  collapsed: boolean;
}

function SidebarLink({ path, name, collapsed }: SidebarLinkProps) {
  const pathname = usePathname();

  return (
    <NextLink
      key={name}
      className={clsx(
        "flex items-center space-x-3 py-3 px-6 hover:bg-gray-700 rounded-md cursor-pointer",
        pathname === path ? "active" : "",
      )}
      role="menuitem"
      tabIndex={0}
      aria-label={name}
      href={path}
    >
      {/*<icon className="h-6 w-6" aria-hidden="true" />*/}
      {!collapsed && <span>{name}</span>}
    </NextLink>
  );
}

interface SidebarProps {
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (isOpen: boolean) => void;
}

export default function Sidebar({
  isSidebarCollapsed,
  setIsSidebarCollapsed,
}: SidebarProps) {
  const user = {
    name: "Thaila N",
    avatar:
      "https://www.tubefilter.com/wp-content/uploads/2018/09/anna-akana-1400x825.jpg",
  };

  const menuItems = [
    { name: "Dashboard", link: "/dashboard", icon: Home },
    { name: "Extrato", link: "/extrato", icon: Home },
    { name: "Cartões", link: "/cartoes", icon: Home },
    { name: "Bancos", link: "/bancos", icon: Home },
  ];

  return (
    <aside
      className={`h-screen fixed left-0 text-white p-4 flex flex-col gap-5 transition-all duration-300 ${isSidebarCollapsed ? "w-[102px]" : "w-64"}`}
      role="navigation"
      aria-label="Sidebar Navigation"
      onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
    >
      <div className="flex items-center justify-center gap-2 bg-[var(--dark-blue)] rounded-[50px] h-[78px]">
        {!isSidebarCollapsed ? (
          <>
            <Image src={LogoSmall} alt="" width={24} height={33} />
            <Image src={Logo} alt="" width={100} height={16} />
          </>
        ) : (
          <Image src={LogoSmall} alt="" width={24} height={33} />
        )}
      </div>

      <div className="bg-[var(--dark-blue)] rounded-3xl h-full flex flex-col py-10">
        <nav className="flex-1">
          {menuItems.map(({ name, link }) => (
            <SidebarLink
              name={name}
              path={link}
              key={name}
              collapsed={isSidebarCollapsed}
            />
          ))}
        </nav>

        <div className="mt-auto">
          <div
            className="flex items-center space-x-3 p-3 hover:bg-gray-700 rounded-md cursor-pointer px-6"
            role="button"
            tabIndex={0}
            aria-label="User Profile"
          >
            <div
              className="w-8 h-8 rounded-full bg-no-repeat bg-cover bg-center"
              style={{ backgroundImage: `url(${user.avatar})` }}
            ></div>
            {!isSidebarCollapsed && <span>Thaila N</span>}
          </div>
          <div
            className="flex items-center space-x-3 p-3 hover:bg-gray-700 rounded-md cursor-pointer px-6"
            role="button"
            tabIndex={0}
            aria-label="Sign Out"
          >
            <LogOut className="h-6 w-6" aria-hidden="true" />
            {!isSidebarCollapsed && <span>Sair</span>}
          </div>
        </div>
      </div>
    </aside>
  );
}
