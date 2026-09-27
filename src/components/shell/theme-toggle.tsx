"use client";

import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Sun, Moon, Monitor, Check } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import {
  setThemePreference,
  useThemePreference,
} from "@/components/shell/theme-store";
import type { ThemePreference } from "@/lib/theme";
import { cn } from "@/lib/cn";

const OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export interface ThemeToggleMessages {
  change: string;
  light: string;
  dark: string;
  system: string;
}

const DEFAULT_MESSAGES: ThemeToggleMessages = {
  change: "Change theme",
  light: "Light",
  dark: "Dark",
  system: "System",
};

export function ThemeToggle({
  messages = DEFAULT_MESSAGES,
}: {
  messages?: ThemeToggleMessages;
}) {
  const theme = useThemePreference();

  const ActiveIcon =
    OPTIONS.find((option) => option.value === theme)?.icon ?? Monitor;

  return (
    <DropdownMenuPrimitive.Root>
      <DropdownMenuPrimitive.Trigger asChild>
        <IconButton
          icon={<ActiveIcon className="size-5" aria-hidden="true" />}
          aria-label={messages.change}
        />
      </DropdownMenuPrimitive.Trigger>
      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          align="end"
          sideOffset={6}
          className="z-50 min-w-40 overflow-hidden rounded-card border border-border bg-surface p-1 shadow-elevated"
        >
          {OPTIONS.map((option) => {
            const Icon = option.icon;
            const isActive = option.value === theme;
            return (
              <DropdownMenuPrimitive.Item
                key={option.value}
                onSelect={() => setThemePreference(option.value)}
                className={cn(
                  "flex cursor-default items-center gap-2 rounded-control px-3 py-2 font-interface text-body text-text-primary outline-none",
                  "data-[highlighted]:bg-elevated",
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                <span className="flex-1">{messages[option.value]}</span>
                {isActive && (
                  <Check
                    className="size-4 text-primary-500"
                    aria-hidden="true"
                  />
                )}
              </DropdownMenuPrimitive.Item>
            );
          })}
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );
}
