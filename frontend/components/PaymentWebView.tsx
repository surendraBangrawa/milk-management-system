import React, { useState, useRef } from "react";
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

  const handleLoadStart = () => {
    setLoading(true);
    setError(null);
  };

  const handleLoadEnd = () => {
    setLoading(false);
  };

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    setError(nativeEvent.description);
    setLoading(false);
    onError(nativeEvent.description);
  };

  const handleNavigationStateChange = (navState: any) => {
    const { url } = navState;

    // Only check for explicit success/failure states
    if (
      url.includes("success") ||
      url.includes("payment_success") ||
      url.includes("paid")
    ) {
      onSuccess();
      onClose();
    } else if (
      url.includes("failure") ||
      url.includes("payment_failed") ||
      url.includes("failed")
    ) {
      onError("Payment failed. Please try again.");
      onClose();
    }

    // Check for callback URLs with status parameters
    if (url.includes("payment-callback")) {
      if (url.includes("razorpay_payment_link_status=paid")) {
        onSuccess();
        onClose();
      } else if (url.includes("razorpay_payment_link_status=failed")) {
        onError("Payment failed. Please try again.");
        onClose();
      }
    }
  };

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.status === "success") {
        onSuccess();
        onClose();
      } else if (data.status === "failure") {
        onError(data.message || "Payment failed");
        onClose();
      }
      // Removed cancellation handling to prevent false positives
    } catch (e) {
      // Ignore non-JSON messages
    }
  };

  const injectedJavaScript = `
    // Listen for payment completion
    window.addEventListener('message', function(event) {
      if (event.data && event.data.status) {
        window.ReactNativeWebView.postMessage(JSON.stringify(event.data));
      }
    });
    
    // Monitor URL changes for success/failure only
    let currentUrl = window.location.href;
    
    const observer = new MutationObserver(function() {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        
        // Only detect explicit success/failure states
        if (currentUrl.includes('success') || currentUrl.includes('payment_success') || currentUrl.includes('paid')) {
          window.ReactNativeWebView.postMessage(JSON.stringify({status: 'success'}));
        } else if (currentUrl.includes('failure') || currentUrl.includes('payment_failed') || currentUrl.includes('failed')) {
          window.ReactNativeWebView.postMessage(JSON.stringify({status: 'failure', message: 'Payment failed'}));
        }
      }
    });
    observer.observe(document.body, {childList: true, subtree: true});
    
    // Monitor for explicit success/failure buttons only
    document.addEventListener('click', function(e) {
      if (e.target.tagName === 'A' && e.target.href) {
        const href = e.target.href;
        if (href.includes('success') || href.includes('paid')) {
          window.ReactNativeWebView.postMessage(JSON.stringify({status: 'success'}));
        } else if (href.includes('failure') || href.includes('failed')) {
          window.ReactNativeWebView.postMessage(JSON.stringify({status: 'failure', message: 'Payment failed'}));
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
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.surface,
              borderBottomColor: colors.border,
            },
          ]}
        >
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
            <View
              style={[
                styles.loadingContainer,
                { backgroundColor: colors.surface + "E6" },
              ]}
            >
              <ActivityIndicator size="large" color={colors.primary} />
              <Text
                style={[styles.loadingText, { color: colors.textSecondary }]}
              >
                Loading payment gateway...
              </Text>
            </View>
          )}

          {error && (
            <View
              style={[
                styles.errorContainer,
                { backgroundColor: colors.surface + "E6" },
              ]}
            >
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
