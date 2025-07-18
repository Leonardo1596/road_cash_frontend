"use client";

import { useSidebar } from "@/components/ui/sidebar";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DollarSign,
  Home,
  Settings,
  Wallet,
  LogOut,
  Loader2,
} from "lucide-react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useIsMobile } from "@/hooks/use-mobile";

function MainNav() {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const { setOpenMobile } = useSidebar();

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/lancamentos", label: "Lançamentos", icon: Wallet },
    { href: "/configuracoes", label: "Configurações", icon: Settings },
  ];

  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton
            asChild
            isActive={pathname === item.href}
            onClick={() => isMobile && setOpenMobile(false)}
            className="data-[active=true]:bg-muted data-[active=true]:text-foreground hover:bg-muted"
          >
            <Link href={item.href}>
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

function UserNav() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("token");
    router.push("/login");
  };

  return (
    <div className="flex items-center gap-2 p-2">
      <Avatar className="h-9 w-9">
        <AvatarImage
          src="https://placehold.co/100x100.png"
          alt="Avatar do usuário"
        />
        <AvatarFallback>U</AvatarFallback>
      </Avatar>
      <div className="grid gap-0.5 text-sm truncate group-data-[collapsible=icon]:hidden">
        <div className="font-medium truncate">Usuário</div>
        <div className="text-muted-foreground truncate">Bem-vindo!</div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="ml-auto group-data-[collapsible=icon]:ml-0"
        onClick={handleLogout}
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isVerified, setIsVerified] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
    } else {
      setIsVerified(true);
    }
  }, [router]);

  const getPageTitle = () => {
    if (pathname.startsWith("/dashboard")) return "Dashboard";
    if (pathname.startsWith("/lancamentos")) return "Lançamentos";
    if (pathname.startsWith("/configuracoes")) return "Configurações";
    return "RoadCash";
  };

  if (!isVerified) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-headline text-lg font-semibold"
          >
            <DollarSign className="h-6 w-6 text-primary" />
            <span className="group-data-[collapsible=icon]:hidden">
              RoadCash
            </span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <MainNav />
        </SidebarContent>
        <SidebarFooter>
          <UserNav />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
          <SidebarTrigger className="md:hidden" />
          <h1 className="font-headline text-xl font-semibold sm:text-2xl">
            {getPageTitle()}
          </h1>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 md:p-6 md:gap-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
