"use client";

import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { User, LogOut, Settings as SettingsIcon } from "lucide-react";
import Link from "next/link";
import { logoutAction } from "@/lib/actions/logout";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/cn";

export function UserMenu() {
  return (
    <DropdownMenuPrimitive.Root>
      <DropdownMenuPrimitive.Trigger asChild>
        <IconButton
          icon={<User className="size-5" aria-hidden="true" />}
          aria-label="User menu"
        />
      </DropdownMenuPrimitive.Trigger>
      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          align="end"
          sideOffset={6}
          className="z-50 min-w-40 overflow-hidden rounded-card border border-border bg-surface p-1 shadow-elevated"
        >
          <DropdownMenuPrimitive.Item asChild>
            <Link
              href="/settings"
              className="flex cursor-default items-center gap-2 rounded-control px-3 py-2 font-interface text-body text-text-primary outline-none data-[highlighted]:bg-elevated"
            >
              <SettingsIcon className="size-4" aria-hidden="true" />
              Settings
            </Link>
          </DropdownMenuPrimitive.Item>
          <DropdownMenuPrimitive.Item
            onSelect={() => {
              void logoutAction();
            }}
            className={cn(
              "flex cursor-default items-center gap-2 rounded-control px-3 py-2 font-interface text-body text-text-primary outline-none",
              "data-[highlighted]:bg-elevated",
            )}
          >
            <LogOut className="size-4" aria-hidden="true" />
            Log out
          </DropdownMenuPrimitive.Item>
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );
}
