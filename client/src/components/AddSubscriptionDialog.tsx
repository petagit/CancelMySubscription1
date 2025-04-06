import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { subscriptionCategories } from "@shared/schema";

interface AddSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
}

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  amount: z.string().min(1, "Amount is required"),
  nextBillingDate: z.string().min(1, "Next billing date is required"),
  category: z.enum(subscriptionCategories as unknown as [string, ...string[]]),
  billingCycle: z.enum(["monthly", "yearly", "quarterly", "weekly"]),
  cancelUrl: z.string().optional(),
});

// Popular subscription services with their details
const popularServices = [
  { 
    name: "Netflix", 
    amount: "15.49", 
    category: "Entertainment", 
    billingCycle: "monthly",
    cancelUrl: "https://www.netflix.com/cancelplan"
  },
  { 
    name: "Spotify", 
    amount: "9.99", 
    category: "Entertainment", 
    billingCycle: "monthly",
    cancelUrl: "https://www.spotify.com/account/subscription/"
  },
  { 
    name: "Disney+", 
    amount: "7.99", 
    category: "Entertainment", 
    billingCycle: "monthly",
    cancelUrl: "https://www.disneyplus.com/account"
  },
  { 
    name: "Amazon Prime", 
    amount: "14.99", 
    category: "Shopping", 
    billingCycle: "monthly",
    cancelUrl: "https://www.amazon.com/manageprime"
  },
  { 
    name: "YouTube Premium", 
    amount: "11.99", 
    category: "Entertainment", 
    billingCycle: "monthly",
    cancelUrl: "https://www.youtube.com/paid_memberships"
  }
];

export default function AddSubscriptionDialog({ open, onOpenChange, onSubmit }: AddSubscriptionDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      amount: "",
      nextBillingDate: new Date().toISOString().split("T")[0],
      category: "Entertainment",
      billingCycle: "monthly",
      cancelUrl: "",
    },
  });

  const handleSubmit = (data: z.infer<typeof formSchema>) => {
    onSubmit(data);
    form.reset();
  };

  const addPopularService = (service: typeof popularServices[0]) => {
    form.setValue("name", service.name);
    form.setValue("amount", service.amount);
    form.setValue("category", service.category as any);
    form.setValue("billingCycle", service.billingCycle as any);
    form.setValue("cancelUrl", service.cancelUrl);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white rounded-lg p-6 w-full max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Add New Subscription</DialogTitle>
          <DialogDescription>
            Add a new subscription to track your spending.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-2">Quick Add Popular Services:</h3>
          <div className="flex flex-wrap gap-2">
            {popularServices.map((service) => (
              <Button
                key={service.name}
                type="button"
                variant="outline"
                size="sm"
                className="border-black bg-white text-black hover:bg-gray-100"
                onClick={() => addPopularService(service)}
              >
                {service.name}
              </Button>
            ))}
          </div>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subscription Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Netflix, Spotify, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly Amount</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="9.99" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="billingCycle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Billing Cycle</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a billing cycle" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="nextBillingDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Next Billing Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {subscriptionCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="cancelUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cancel URL (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/cancel" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" className="border-black bg-black text-white hover:bg-gray-800" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-black text-white hover:bg-gray-800">
                Add Subscription
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
