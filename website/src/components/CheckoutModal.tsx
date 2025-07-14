import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { ChevronLeft, ChevronRight, CreditCard, Truck, CheckCircle, Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
}

type CheckoutStep = 'shipping' | 'payment' | 'confirmation';

const CheckoutModal = ({ open, onClose }: CheckoutModalProps) => {
  const { state, dispatch } = useCart();
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('shipping');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  
  const [shippingData, setShippingData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    address: '',
    city: '',
    zipCode: '',
    country: 'United States'
  });
  
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: ''
  });

  const steps = [
    { id: 'shipping', label: 'Shipping', icon: Truck },
    { id: 'payment', label: 'Payment', icon: CreditCard },
    { id: 'confirmation', label: 'Confirmation', icon: CheckCircle }
  ];

  const getCurrentStepIndex = () => steps.findIndex(step => step.id === currentStep);

  const handleNext = () => {
    if (currentStep === 'shipping') {
      setCurrentStep('payment');
    } else if (currentStep === 'payment') {
      setCurrentStep('confirmation');
    }
  };

  const handleBack = () => {
    if (currentStep === 'payment') {
      setCurrentStep('shipping');
    } else if (currentStep === 'confirmation') {
      setCurrentStep('payment');
    }
  };

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    
    // Simulate order processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsProcessing(false);
    setOrderComplete(true);
    
    // Clear cart after successful order
    setTimeout(() => {
      dispatch({ type: 'CLEAR_CART' });
      onClose();
      setOrderComplete(false);
      setCurrentStep('shipping');
    }, 3000);
  };

  const isStepValid = (step: CheckoutStep) => {
    switch (step) {
      case 'shipping':
        return shippingData.firstName && shippingData.lastName && shippingData.email && 
               shippingData.address && shippingData.city && shippingData.zipCode;
      case 'payment':
        return paymentData.cardNumber && paymentData.expiryDate && 
               paymentData.cvv && paymentData.cardName;
      default:
        return true;
    }
  };

  if (orderComplete) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md text-center">
          <div className="py-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-scale-in">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-heading font-semibold mb-4 animate-fade-in">
              Order Placed Successfully!
            </h2>
            <p className="text-muted-foreground mb-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
              Thank you for your purchase. You'll receive a confirmation email shortly.
            </p>
            <div className="space-y-2 animate-fade-in" style={{ animationDelay: '400ms' }}>
              <p className="text-sm text-muted-foreground">Order Number</p>
              <p className="font-mono text-lg font-semibold">#VT{Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="border-b border-border pb-4">
          <DialogTitle className="text-2xl font-heading flex items-center gap-3">
            <Package className="h-6 w-6 text-primary" />
            Checkout
          </DialogTitle>
          
          {/* Progress Steps */}
          <div className="flex items-center justify-center mt-6">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = index < getCurrentStepIndex();
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={cn(
                    "flex flex-col items-center",
                    isActive && "animate-scale-in"
                  )}>
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                      isActive ? "bg-primary border-primary text-primary-foreground" :
                      isCompleted ? "bg-green-500 border-green-500 text-white" :
                      "border-muted-foreground text-muted-foreground"
                    )}>
                      <StepIcon className="h-4 w-4" />
                    </div>
                    <span className={cn(
                      "text-xs mt-2 transition-colors duration-300",
                      isActive ? "text-primary font-medium" : "text-muted-foreground"
                    )}>
                      {step.label}
                    </span>
                  </div>
                  
                  {index < steps.length - 1 && (
                    <div className={cn(
                      "w-16 h-0.5 mx-4 transition-colors duration-300",
                      isCompleted ? "bg-green-500" : "bg-muted"
                    )} />
                  )}
                </div>
              );
            })}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex">
          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {currentStep === 'shipping' && (
              <div className="space-y-6 animate-fade-in">
                <h3 className="text-lg font-heading font-semibold">Shipping Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={shippingData.firstName}
                      onChange={(e) => setShippingData(prev => ({ ...prev, firstName: e.target.value }))}
                      className="mt-1 focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={shippingData.lastName}
                      onChange={(e) => setShippingData(prev => ({ ...prev, lastName: e.target.value }))}
                      className="mt-1 focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={shippingData.email}
                      onChange={(e) => setShippingData(prev => ({ ...prev, email: e.target.value }))}
                      className="mt-1 focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="address">Address *</Label>
                    <Input
                      id="address"
                      value={shippingData.address}
                      onChange={(e) => setShippingData(prev => ({ ...prev, address: e.target.value }))}
                      className="mt-1 focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={shippingData.city}
                      onChange={(e) => setShippingData(prev => ({ ...prev, city: e.target.value }))}
                      className="mt-1 focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div>
                    <Label htmlFor="zipCode">ZIP Code *</Label>
                    <Input
                      id="zipCode"
                      value={shippingData.zipCode}
                      onChange={(e) => setShippingData(prev => ({ ...prev, zipCode: e.target.value }))}
                      className="mt-1 focus:ring-primary focus:border-primary"
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 'payment' && (
              <div className="space-y-6 animate-fade-in">
                <h3 className="text-lg font-heading font-semibold">Payment Information</h3>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="cardName">Cardholder Name *</Label>
                    <Input
                      id="cardName"
                      value={paymentData.cardName}
                      onChange={(e) => setPaymentData(prev => ({ ...prev, cardName: e.target.value }))}
                      className="mt-1 focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cardNumber">Card Number *</Label>
                    <Input
                      id="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      value={paymentData.cardNumber}
                      onChange={(e) => setPaymentData(prev => ({ ...prev, cardNumber: e.target.value }))}
                      className="mt-1 focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expiryDate">Expiry Date *</Label>
                      <Input
                        id="expiryDate"
                        placeholder="MM/YY"
                        value={paymentData.expiryDate}
                        onChange={(e) => setPaymentData(prev => ({ ...prev, expiryDate: e.target.value }))}
                        className="mt-1 focus:ring-primary focus:border-primary"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cvv">CVV *</Label>
                      <Input
                        id="cvv"
                        placeholder="123"
                        value={paymentData.cvv}
                        onChange={(e) => setPaymentData(prev => ({ ...prev, cvv: e.target.value }))}
                        className="mt-1 focus:ring-primary focus:border-primary"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 'confirmation' && (
              <div className="space-y-6 animate-fade-in">
                <h3 className="text-lg font-heading font-semibold">Order Confirmation</h3>
                
                <div className="space-y-4">
                  <div className="bg-card p-4 rounded-lg border border-border">
                    <h4 className="font-medium mb-3">Shipping Address</h4>
                    <p className="text-sm text-muted-foreground">
                      {shippingData.firstName} {shippingData.lastName}<br />
                      {shippingData.address}<br />
                      {shippingData.city}, {shippingData.zipCode}<br />
                      {shippingData.country}
                    </p>
                  </div>
                  
                  <div className="bg-card p-4 rounded-lg border border-border">
                    <h4 className="font-medium mb-3">Payment Method</h4>
                    <p className="text-sm text-muted-foreground">
                      **** **** **** {paymentData.cardNumber.slice(-4)}
                    </p>
                  </div>
                </div>
                
                <Button
                  onClick={handlePlaceOrder}
                  disabled={isProcessing}
                  className="w-full h-12 text-base font-medium hover-scale"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
                      Processing Order...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Place Order - ${state.totalPrice.toFixed(2)}
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="w-80 border-l border-border p-6 bg-card/30">
            <h3 className="text-lg font-heading font-semibold mb-4">Order Summary</h3>
            
            <div className="space-y-4 mb-6">
              {state.items.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className="w-16 h-20 flex-shrink-0 overflow-hidden rounded-md">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium line-clamp-2">{item.name}</h4>
                    <p className="text-xs text-muted-foreground capitalize">
                      {item.color} • Qty: {item.quantity}
                    </p>
                    <p className="text-sm font-semibold text-primary">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            <Separator className="my-4" />
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>${state.totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax</span>
                <span>${(state.totalPrice * 0.08).toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span className="text-primary">${(state.totalPrice * 1.08).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Footer */}
        {currentStep !== 'confirmation' && (
          <div className="border-t border-border p-6 flex justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 'shipping'}
              className="hover-scale"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            <Button
              onClick={handleNext}
              disabled={!isStepValid(currentStep)}
              className="hover-scale"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CheckoutModal;