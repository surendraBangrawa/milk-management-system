import {
  Text,
  Pressable,
  TouchableOpacity,
  View,
  StyleSheet,
  ActivityIndicator,
  ImageBackground,
  Platform,
  ScrollView,
  Dimensions,
  Image,
  Animated,
  Vibration,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import SafeAreaWrapper from "@/components/SafeAreaWrapper";
import React, { useRef, useEffect } from "react"; // Import useEffect
import { useSession } from "@/context/AuthProvider";
import { Redirect, useRouter } from "expo-router";
import useTheme from "@/context/theme/useTheme";
import { useTranslation } from "react-i18next";
import {
  scaleWidth,
  scaleHeight,
  getResponsiveFontSize,
} from "@/utils/responsiveUtils";

const { width: viewportWidth } = Dimensions.get("window");

interface CarouselItem {
  image?: any;
  titleKey: string;
  descriptionKey: string;
}

// Define your marketing content (using translation keys)
const marketingSlides: CarouselItem[] = [
  {
    image: require("@/assets/images/slides/slide1.png"), // Ensure these paths are correct
    titleKey: "carousel.slide1_title",
    descriptionKey: "carousel.slide1_desc",
  },
  {
    image: require("@/assets/images/slides/slide2.png"),
    titleKey: "carousel.slide2_title",
    descriptionKey: "carousel.slide2_desc",
  },
  {
    image: require("@/assets/images/slides/slide3.png"),
    titleKey: "carousel.slide3_title",
    descriptionKey: "carousel.slide3_desc",
  },
];

const HeroScreen = () => {
  const router = useRouter();
  const { session, isLoading } = useSession();
  const { colors } = useTheme();
  const { t } = useTranslation();

  const carouselScrollViewRef = useRef<ScrollView>(null);
  const [activeSlide, setActiveSlide] = React.useState(0);
  const [isLandscape, setIsLandscape] = React.useState(false);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;

  // Entrance animations and landscape detection
  useEffect(() => {
    // Initial entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    // Landscape detection
    const updateLayout = () => {
      const { width, height } = Dimensions.get("window");
      setIsLandscape(width > height);
    };

    const subscription = Dimensions.addEventListener("change", updateLayout);
    updateLayout(); // Initial check

    return () => {
      subscription?.remove();
    };
  }, [fadeAnim, scaleAnim, slideAnim]);

  // Auto-scroll logic for carousel
  useEffect(() => {
    const interval = setInterval(() => {
      const nextSlide = (activeSlide + 1) % marketingSlides.length;
      if (carouselScrollViewRef.current) {
        carouselScrollViewRef.current.scrollTo({
          x: nextSlide * viewportWidth,
          animated: true,
        });
      }
      setActiveSlide(nextSlide);
    }, 3000); // Change slide every 3 seconds

    return () => clearInterval(interval); // Clear interval on unmount
  }, [activeSlide]); // Re-run effect if activeSlide changes

  const onScroll = (event: any) => {
    const slide = Math.round(event.nativeEvent.contentOffset.x / viewportWidth);
    if (slide !== activeSlide) {
      setActiveSlide(slide);
    }
  };

  const scrollToSlide = async (index: number) => {
    // Haptic feedback on dot press
    if (Platform.OS === "ios") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      Vibration.vibrate(30);
    }

    if (carouselScrollViewRef.current) {
      carouselScrollViewRef.current.scrollTo({
        x: index * viewportWidth,
        animated: true,
      });
    }
    setActiveSlide(index);
  };

  const handleButtonPress = async (route: "/auth/signin" | "/auth/signup") => {
    // Haptic feedback on button press
    if (Platform.OS === "ios") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      Vibration.vibrate(50);
    }

    // Button press animation (same as signin screen)
    Animated.sequence([
      Animated.timing(buttonScaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    router.push(route);
  };

  if (isLoading) {
    return (
      <SafeAreaWrapper>
        <View
          style={[
            styles.centeredContainer,
            { backgroundColor: colors.background },
          ]}
        >
          <ActivityIndicator size="large" color={colors.primary} />
          <Text
            style={[
              styles.loadingText,
              { color: colors.textPrimary, marginTop: 10 },
            ]}
          >
            {t("hero.loading_session")}
          </Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  if (session) {
    return <Redirect href="/(app)/(tabs)/(home)" />;
  }

  return (
    <SafeAreaWrapper>
      <ImageBackground
        style={[styles.container, { backgroundColor: colors.background }]}
        resizeMode="cover"
      >
        <Animated.View
          style={[
            styles.heroContent,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
            },
            isLandscape && styles.landscapeContent,
          ]}
        >
          <Text style={[styles.appLogoText, { color: colors.textPrimary }]}>
            {t("app_name")}
          </Text>

          <ScrollView
            ref={carouselScrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
            style={styles.carouselScrollView}
          >
            {marketingSlides.map((item, index) => (
              <View key={index} style={styles.carouselItem}>
                {item.image && (
                  <Image
                    source={item.image}
                    style={styles.carouselImage}
                    resizeMode="contain"
                  />
                )}
                <Text
                  style={[styles.carouselTitle, { color: colors.textPrimary }]}
                >
                  {t(item.titleKey)}
                </Text>
                <Text
                  style={[
                    styles.carouselDescription,
                    { color: colors.textSecondary },
                  ]}
                >
                  {t(item.descriptionKey)}
                </Text>
              </View>
            ))}
          </ScrollView>

          {/* Pagination Dots */}
          <View style={styles.paginationDotsContainer}>
            {marketingSlides.map((_, index) => (
              <Pressable
                key={`dot-${index}`}
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      index === activeSlide
                        ? colors.primary
                        : colors.textSecondary,
                    opacity: index === activeSlide ? 1 : 0.4,
                  },
                ]}
                onPress={() => scrollToSlide(index)}
                accessibilityLabel={t("carousel.dot_label", {
                  index: index + 1,
                })}
              />
            ))}
          </View>

          {/* Action Buttons */}
          <Animated.View
            style={[
              styles.buttonGroup,
              {
                transform: [{ scale: buttonScaleAnim }],
              },
            ]}
          >
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={() => handleButtonPress("/auth/signin")}
              accessibilityLabel={t("hero.signin_button")}
              accessibilityRole="button"
            >
              <View style={styles.buttonContent}>
                <Ionicons
                  name="log-in-outline"
                  size={20}
                  color={colors.surface}
                />
                <Text style={[styles.buttonText, { color: colors.surface }]}>
                  {t("hero.signin_button")}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.secondaryButton,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.primary,
                },
              ]}
              onPress={() => handleButtonPress("/auth/signup")}
              accessibilityLabel={t("hero.signup_button")}
              accessibilityRole="button"
            >
              <View style={styles.buttonContent}>
                <Ionicons
                  name="person-add-outline"
                  size={20}
                  color={colors.primary}
                />
                <Text
                  style={[
                    styles.secondaryButtonText,
                    { color: colors.primary },
                  ]}
                >
                  {t("hero.signup_button")}
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </ImageBackground>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  heroContent: {
    alignItems: "center",
    justifyContent: "center", // Keep centered within its own space
    width: "100%",
    maxWidth: scaleWidth(400), // Max width for content on larger screens
    flex: 1, // Allow hero content to take available space
  },
  landscapeContent: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: scaleWidth(40),
  },
  appLogoText: {
    fontSize: getResponsiveFontSize(42), // Responsive font size
    fontWeight: "800", // Bolder font weight
    marginBottom: scaleHeight(20), // Responsive margin
    textAlign: "center",
    paddingHorizontal: scaleWidth(20),
    letterSpacing: 0.5, // Subtle letter spacing
  },
  subtitle: {
    fontSize: 18, // Kept same
    lineHeight: 26, // Added line height for readability
    marginBottom: 30, // Reduced margin to bring elements closer
    textAlign: "center",
    paddingHorizontal: 20,
  },
  // --- Carousel Styles ---
  carouselScrollView: {
    height: scaleHeight(320), // Responsive height
    width: viewportWidth,
    marginBottom: scaleHeight(25), // Responsive margin
  },
  carouselItem: {
    width: viewportWidth,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: scaleWidth(20),
    paddingVertical: scaleHeight(15), // Responsive padding
  },
  carouselImage: {
    width: "90%",
    height: scaleHeight(180), // Responsive height
    marginBottom: scaleHeight(20), // Responsive margin
  },
  carouselTitle: {
    fontSize: getResponsiveFontSize(24), // Responsive font size
    fontWeight: "700", // Bolder
    textAlign: "center",
    marginBottom: scaleHeight(8), // Responsive margin
  },
  carouselDescription: {
    fontSize: getResponsiveFontSize(15), // Responsive font size
    textAlign: "center",
    lineHeight: scaleHeight(22), // Responsive line height
    paddingHorizontal: scaleWidth(10), // Responsive padding
  },
  paginationDotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: scaleHeight(40), // Responsive margin
  },
  dot: {
    width: scaleWidth(8), // Responsive dot size
    height: scaleHeight(8),
    borderRadius: scaleWidth(4), // Responsive border radius
    marginHorizontal: scaleWidth(5), // Responsive margin
  },
  // --- Button Group ---
  buttonGroup: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: scaleWidth(20), // Responsive padding
    marginTop: "auto", // Push button group to the bottom (within heroContent)
    marginBottom: scaleHeight(20), // Responsive margin
  },
  // --- Button Styles ---
  button: {
    paddingVertical: scaleHeight(14), // Responsive button height
    paddingHorizontal: scaleWidth(30), // Responsive padding
    borderRadius: 8, // Slightly less rounded for a more modern look
    marginBottom: scaleHeight(12), // Responsive margin
    width: "100%",
    maxWidth: scaleWidth(260), // Responsive max width
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: getResponsiveFontSize(17), // Responsive font size
    fontWeight: "700", // Bolder
    marginLeft: scaleWidth(8), // Space between icon and text
  },
  secondaryButton: {
    borderWidth: 1.5, // Slightly thinner border
  },
  secondaryButtonText: {
    fontSize: getResponsiveFontSize(17), // Responsive font size
    fontWeight: "700",
    marginLeft: scaleWidth(8), // Space between icon and text
  },
  loadingText: {
    fontSize: getResponsiveFontSize(18), // Responsive font size
    textAlign: "center",
  },
});

export default HeroScreen;
