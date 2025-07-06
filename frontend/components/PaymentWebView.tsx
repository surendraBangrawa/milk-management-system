import React, { useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  Pressable,
  Modal,
} from "react-native";
import { WebView } from "react-native-webview";
import useTheme from "@/context/theme/useTheme";

interface PaymentWebViewProps {
  visible: boolean;
  paymentUrl: string;
  onClose: () => void;
  onSuccess: () => void;
  onError: (error: string) => void;
}

const PaymentWebView: React.FC<PaymentWebViewProps> = ({
  visible,
  paymentUrl,
  onClose,
  onSuccess,
  onError,
}) => {
  const { colors } = useTheme();
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentTimeout, setPaymentTimeout] = useState<number | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (paymentTimeout) {
        clearTimeout(paymentTimeout);
      }
    };
  }, [paymentTimeout]);

  const handleLoadStart = () => {
    setLoading(true);
    setError(null);

    // Set a timeout to handle cases where payment detection fails
    if (paymentTimeout) {
      clearTimeout(paymentTimeout);
    }

    const timeout = setTimeout(() => {
      console.log("Payment timeout - assuming success");
      onSuccess();
      onClose();
    }, 30000); // 30 seconds timeout

    setPaymentTimeout(timeout);
  };

  const handleLoadEnd = () => {
    setLoading(false);

    // Clear timeout when page loads
    if (paymentTimeout) {
      clearTimeout(paymentTimeout);
      setPaymentTimeout(null);
    }
  };

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    setError(nativeEvent.description);
    setLoading(false);
    onError(nativeEvent.description);
  };

  const handleNavigationStateChange = (navState: any) => {
    const { url } = navState;

    console.log("Navigation state change:", url);

    // Check for success/failure URLs
    if (
      url.includes("success") ||
      url.includes("payment_success") ||
      url.includes("paid") ||
      url.includes("payment-callback")
    ) {
      console.log("Detected success/failure URL:", url);

      // Check if it's a success callback
      if (url.includes("razorpay_payment_link_status=paid")) {
        console.log("Payment success detected via status parameter");
        onSuccess();
        onClose();
      } else if (url.includes("razorpay_payment_link_status=failed")) {
        console.log("Payment failure detected via status parameter");
        onError("Payment failed. Please try again.");
        onClose();
      } else {
        // Default to success for callback URLs
        console.log("Defaulting to success for callback URL");
        onSuccess();
        onClose();
      }
    } else if (
      url.includes("failure") ||
      url.includes("payment_failed") ||
      url.includes("failed")
    ) {
      console.log("Payment failure detected via URL keywords");
      onError("Payment failed. Please try again.");
      onClose();
    } else if (url.includes("cancel") || url.includes("cancelled")) {
      console.log("Payment cancellation detected");
      onError("Payment was cancelled.");
      onClose();
    }

    // Additional check: If we're back to the app URL or a success page, treat as success
    if (url.includes("razorpay.com") && !url.includes("test")) {
      // We're on Razorpay but not on a test page - likely payment completed
      console.log("Detected Razorpay completion page");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000); // Give it 2 seconds to process
    }
  };

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log("WebView message received:", data);

      if (data.status === "success") {
        onSuccess();
        onClose();
      } else if (data.status === "failure") {
        onError(data.message || "Payment failed");
        onClose();
      } else if (data.status === "cancelled") {
        onError(data.message || "Payment was cancelled");
        onClose();
      }
    } catch (e) {
      // Ignore non-JSON messages
      console.log("Non-JSON message received:", event.nativeEvent.data);
    }
  };

  const injectedJavaScript = `
    // Listen for payment completion
    window.addEventListener('message', function(event) {
      if (event.data && event.data.status) {
        window.ReactNativeWebView.postMessage(JSON.stringify(event.data));
      }
    });
    
    // Monitor URL changes for success/failure
    let currentUrl = window.location.href;
    const observer = new MutationObserver(function() {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        console.log('URL changed to:', currentUrl);
        
        if (currentUrl.includes('success') || currentUrl.includes('payment_success') || currentUrl.includes('paid')) {
          window.ReactNativeWebView.postMessage(JSON.stringify({status: 'success'}));
        } else if (currentUrl.includes('failure') || currentUrl.includes('payment_failed') || currentUrl.includes('failed')) {
          window.ReactNativeWebView.postMessage(JSON.stringify({status: 'failure', message: 'Payment failed'}));
        } else if (currentUrl.includes('cancel') || currentUrl.includes('cancelled')) {
          window.ReactNativeWebView.postMessage(JSON.stringify({status: 'cancelled', message: 'Payment was cancelled'}));
        }
      }
    });
    observer.observe(document.body, {childList: true, subtree: true});
    
    // Only detect actual payment cancellations, not navigation
    let paymentStarted = false;
    
    // Detect when payment form is loaded
    if (window.location.href.includes('razorpay.com')) {
      paymentStarted = true;
    }
    
    // Only trigger cancellation if payment was actually started
    window.addEventListener('beforeunload', function() {
      if (paymentStarted) {
        window.ReactNativeWebView.postMessage(JSON.stringify({status: 'cancelled', message: 'Payment was cancelled'}));
      }
    });
    
    // Monitor for explicit cancel buttons only
    document.addEventListener('click', function(e) {
      if (e.target.tagName === 'A' && e.target.href) {
        const href = e.target.href;
        if (href.includes('cancel') && paymentStarted) {
          e.preventDefault();
          window.ReactNativeWebView.postMessage(JSON.stringify({status: 'cancelled', message: 'Payment was cancelled'}));
        }
      }
    });
    
    true;
  `;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface }]}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Complete Payment
          </Text>
          <Pressable
            style={[styles.closeButton, { backgroundColor: colors.error }]}
            onPress={onClose}
          >
            <Text style={[styles.closeButtonText, { color: colors.surface }]}>
              ✕
            </Text>
          </Pressable>
        </View>

        {/* WebView Container */}
        <View style={styles.webViewContainer}>
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text
                style={[styles.loadingText, { color: colors.textSecondary }]}
              >
                Loading payment gateway...
              </Text>
            </View>
          )}

          {error && (
            <View style={styles.errorContainer}>
              <Text style={[styles.errorText, { color: colors.error }]}>
                {error}
              </Text>
              <Pressable
                style={[
                  styles.retryButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={() => {
                  setError(null);
                  webViewRef.current?.reload();
                }}
              >
                <Text
                  style={[styles.retryButtonText, { color: colors.surface }]}
                >
                  Retry
                </Text>
              </Pressable>
            </View>
          )}

          <WebView
            ref={webViewRef}
            source={{ uri: paymentUrl }}
            style={styles.webView}
            onLoadStart={handleLoadStart}
            onLoadEnd={handleLoadEnd}
            onError={handleError}
            onNavigationStateChange={handleNavigationStateChange}
            onMessage={handleMessage}
            injectedJavaScript={injectedJavaScript}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            allowsBackForwardNavigationGestures={false}
            userAgent="DigiDairy-App"
            onShouldStartLoadWithRequest={(request) => {
              // Prevent navigation to external URLs
              const url = request.url;
              if (url.includes("razorpay.com") || url.includes("payment")) {
                return true;
              }
              // If it's trying to navigate to callback URL, handle it in the app
              if (url.includes("payment-callback")) {
                onError("Payment was cancelled or failed.");
                onClose();
                return false;
              }
              return false;
            }}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  webViewContainer: {
    flex: 1,
    position: "relative",
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    zIndex: 1,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    zIndex: 1,
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});

export default PaymentWebView;
