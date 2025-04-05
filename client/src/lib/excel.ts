import { Subscription } from "@shared/schema";
import { formatDate } from "./utils";

export function exportToExcel(subscriptions: Subscription[], filename: string) {
  if (!subscriptions || subscriptions.length === 0) {
    alert("No subscriptions to export");
    return;
  }
  
  // Format the data for CSV
  const headers = ["Name", "Amount", "Billing Cycle", "Next Billing Date", "Category"];
  const csvContent = [
    headers.join(","),
    ...subscriptions.map(sub => [
      sub.name,
      `$${Number(sub.amount).toFixed(2)}`,
      sub.billingCycle,
      formatDate(new Date(sub.nextBillingDate)),
      sub.category
    ].join(","))
  ].join("\n");
  
  // Create a Blob and download link
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
