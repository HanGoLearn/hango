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

const CONFIRM_TEXT = "DELETE";

export function DeleteAccountButton() {
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    await deleteAccountAction();
  }

  return (
    <Modal>
      <ModalTrigger asChild>
        <Button type="button" variant="secondary" className="w-fit gap-1.5">
          <Trash2 className="size-4" aria-hidden="true" />
          Delete account
        </Button>
      </ModalTrigger>
      <ModalContent>
        <ModalTitle>Delete your account?</ModalTitle>
        <ModalDescription>
          This permanently deletes your account and all learning data —
          progress, lesson history, speaking/writing attempts, and AI
          conversations. This cannot be undone.
        </ModalDescription>
        <div className="mt-4 flex flex-col gap-2">
          <Body>
            Type <strong>{CONFIRM_TEXT}</strong> to confirm.
          </Body>
          <Input
            value={confirmText}
            onChange={(event) => setConfirmText(event.target.value)}
            aria-label="Confirmation text"
          />
        </div>
        <Button
          type="button"
          variant="primary"
          className="mt-4 w-fit bg-error-500 hover:bg-error-700"
          disabled={confirmText !== CONFIRM_TEXT || deleting}
          loading={deleting}
          onClick={() => void handleDelete()}
        >
          Permanently delete account
        </Button>
      </ModalContent>
    </Modal>
  );
}
