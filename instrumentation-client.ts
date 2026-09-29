import { reportClientError } from "@/lib/client-error-reporting";

window.addEventListener("error", (event) => {
  reportClientError("window_error", event.error);
});

window.addEventListener("unhandledrejection", (event) => {
  reportClientError("unhandled_rejection", event.reason);
});
