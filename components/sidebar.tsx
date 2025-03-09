"use client";

import {
  ElementType,
  ForwardRefExoticComponent,
  RefAttributes,
  SVGProps,
  useState,
} from "react";
import Image from "next/image";
import { CreditCard, Home, PageEdit, Planimetry, Wallet } from "iconoir-react";
import LogoSmall from "@/public/logo-small.png";
import Logo from "@/assets/logo.svg";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { LogOut } from "lucide-react";

interface SidebarLinkProps {
  path: string;
  name: string;
  icon: ElementType;
  collapsed: boolean;
  hoveredIndex: number;
  onHover: (index: number) => void;
  index: number;
}

function SidebarLink({
  path,
  name,
  collapsed,
  hoveredIndex,
  onHover,
  icon: Icon,
  index,
}: SidebarLinkProps) {
  const pathname = usePathname();

  return (
    <NextLink
      key={name}
      className={clsx(
        "group flex items-center space-x-3 h-12 [&:not(.active)]:py-3 [&:not(.active)]:px-6 hover:bg-gray-700 rounded-md cursor-pointer relative w-full transition-all duration-500 z-50",
        pathname === path ? "active float-end" : "",
        hoveredIndex === index ? "active" : pathname !== path && "inactive",
        hoveredIndex > 0 &&
          hoveredIndex !== index &&
          "other-hovered !py-3 !px-6",
      )}
      role="menuitem"
      tabIndex={0}
      aria-label={name}
      href={path}
      onMouseEnter={() => onHover(index)}
      onMouseLeave={() => onHover(-1)}
    >
      <span className="relative w-5 h-5">
        <Icon
          className={clsx(
            "w-5 h-5 group-[.active]:opacity-0 z-50 absolute top-0",
            hoveredIndex > 0 && hoveredIndex !== index ? "!opacity-100" : "",
          )}
        />
      </span>
      <div className="group-[.other-hovered]:hidden group-[.active]:absolute group-[.active]:-top-10 group-[.active]:right-0 group-[.active]:h-10 group-[.active]:w-7 group-[.active]:bg-blue-50 group-[.active]:before:content-[''] group-[.active]:before:absolute group-[.active]:before:top-0 group-[.active]:before:right-0 group-[.active]:before:w-7 group-[.active]:before:h-10 group-[.active]:before:rounded-br-[2rem] group-[.active]:before:bg-[var(--dark-blue)] group-[.active]:z-10 bg-transparent"></div>
      {!collapsed && (
        <span
          className={clsx(
            "group-[.active]:flex-1 group-[.active]:text-right transition-all duration-400 group-[.active]:mr-24",
            hoveredIndex > 0 && hoveredIndex !== index
              ? "!mr-0 !text-left"
              : "",
          )}
        >
          {name}
        </span>
      )}
      <div
        className={clsx(
          "group-[.other-hovered]:hidden group-[.inactive]:hidden group-[.active]:rounded-tl-3xl group-[.active]:rounded-bl-3xl group-[.active]:bg-blue-50 group-[.active]:w-20  group-[.active]:h-full flex items-center pl-2 group-[.active]:absolute group-[.active]:right-0 opacity-0 group-[.active]:opacity-100",
          collapsed && "!w-16",
        )}
      >
        <div className="flex items-center justify-center p-2 bg-red w-10 h-10 rounded-full bg-red-200 text-black">
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="group-[.other-hovered]:hidden group-[.active]:absolute group-[.active]:-bottom-10 group-[.active]:right-0 group-[.active]:h-10 group-[.active]:w-7 group-[.active]:bg-blue-50 group-[.active]:before:content-[''] group-[.active]:before:absolute group-[.active]:before:top-0 group-[.active]:before:right-0 group-[.active]:before:w-7 group-[.active]:before:h-10 group-[.active]:before:rounded-tr-[2rem] group-[.active]:before:bg-[var(--dark-blue)] group-[.active]:z-10 bg-transparent"></div>
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
  const [hoveredIndex, setHoveredIndex] = useState<number>(-1);
  const user = {
    name: "Thaila N",
    avatar:
      "https://www.tubefilter.com/wp-content/uploads/2018/09/anna-akana-1400x825.jpg",
  };

  const menuItems = [
    { name: "Dashboard", link: "/app/dashboard", icon: Planimetry },
    { name: "Extrato", link: "/app/extrato", icon: PageEdit },
    { name: "Cartões", link: "/app/cartoes", icon: CreditCard },
    { name: "Bancos", link: "/app/bancos", icon: Wallet },
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

      <div className="bg-[var(--dark-blue)] rounded-3xl h-full flex flex-col pb-10 pt-16">
        <nav className="flex-1">
          {menuItems.map(({ name, link, icon }, index) => (
            <SidebarLink
              name={name}
              path={link}
              key={name}
              hoveredIndex={hoveredIndex}
              collapsed={isSidebarCollapsed}
              onHover={(i) => setHoveredIndex(i)}
              index={index}
              icon={icon}
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
