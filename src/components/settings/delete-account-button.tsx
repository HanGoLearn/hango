"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Modal,
  ModalTrigger,
  ModalContent,
  ModalTitle,
  ModalDescription,
} from "@/components/ui/modal";
import { Body } from "@/components/ui/typography";
import { deleteAccountAction } from "@/lib/actions/settings";
import type { AppLocale } from "@/i18n/config";
import type { SettingsMessages } from "@/i18n/messages/types";
import { formatMessage } from "@/i18n/format";

export function DeleteAccountButton({
  locale,
  messages,
}: {
  locale: AppLocale;
  messages: SettingsMessages["deleteAccount"];
}) {
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    await deleteAccountAction(locale);
  }

  return (
    <Modal>
      <ModalTrigger asChild>
        <Button type="button" variant="secondary" className="w-fit gap-1.5">
          <Trash2 className="size-4" aria-hidden="true" />
          {messages.open}
        </Button>
      </ModalTrigger>
      <ModalContent>
        <ModalTitle>{messages.title}</ModalTitle>
        <ModalDescription>{messages.description}</ModalDescription>
        <div className="mt-4 flex flex-col gap-2">
          <Body>
            {formatMessage(messages.instruction, {
              confirmation: messages.confirmation,
            })}
          </Body>
          <Input
            value={confirmText}
            onChange={(event) => setConfirmText(event.target.value)}
            aria-label={messages.ariaLabel}
          />
        </div>
        <Button
          type="button"
          variant="primary"
          className="mt-4 w-fit bg-error-500 hover:bg-error-700"
          disabled={confirmText !== messages.confirmation || deleting}
          loading={deleting}
          onClick={() => void handleDelete()}
        >
          {messages.action}
        </Button>
      </ModalContent>
    </Modal>
  );
}
