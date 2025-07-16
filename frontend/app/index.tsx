import {
  Text,
  Pressable,
  View,
  StyleSheet,
  ActivityIndicator,
  ImageBackground,
  Platform,
  ScrollView,
  Dimensions,
  Image,
  // SafeAreaView, // Remove this line
} from "react-native";
import SafeAreaWrapper from "@/components/SafeAreaWrapper";
import React, { useRef, useEffect } from "react"; // Import useEffect
import { useSession } from "@/context/AuthProvider";
import { Redirect, useRouter } from "expo-router";
import useTheme from "@/context/theme/useTheme";
import { useTranslation } from "react-i18next";

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
  const { colors, themeMode } = useTheme();
  const { t } = useTranslation();

  const carouselScrollViewRef = useRef<ScrollView>(null);
  const [activeSlide, setActiveSlide] = React.useState(0);

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
  }, [activeSlide, marketingSlides.length]); // Re-run effect if activeSlide or number of slides changes

  const onScroll = (event: any) => {
    const slide = Math.round(event.nativeEvent.contentOffset.x / viewportWidth);
    if (slide !== activeSlide) {
      setActiveSlide(slide);
    }
  };

  const scrollToSlide = (index: number) => {
    if (carouselScrollViewRef.current) {
      carouselScrollViewRef.current.scrollTo({
        x: index * viewportWidth,
        animated: true,
      });
    }
    setActiveSlide(index);
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
        <View style={styles.heroContent}>
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
          <View style={styles.buttonGroup}>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                { backgroundColor: colors.primary },
                Platform.select({
                  ios: {
                    shadowOpacity: pressed ? 0.2 : 0.1,
                    shadowRadius: pressed ? 3 : 4,
                  },
                  android: {
                    elevation: pressed ? 2 : 3,
                  },
                }),
              ]}
              onPress={() => {
                router.push("/auth/signin");
              }}
              accessibilityLabel={t("hero.signin_button")}
            >
              <Text style={[styles.buttonText, { color: colors.textPrimary }]}>
                {t("hero.signin_button")}
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.button,
                styles.secondaryButton,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.primary,
                },
                Platform.select({
                  ios: {
                    shadowOpacity: pressed ? 0.2 : 0.1,
                    shadowRadius: pressed ? 3 : 4,
                  },
                  android: {
                    elevation: pressed ? 2 : 3,
                  },
                }),
              ]}
              onPress={() => {
                router.push("/auth/signup");
              }}
              accessibilityLabel={t("hero.signup_button")}
            >
              <Text
                style={[styles.secondaryButtonText, { color: colors.primary }]}
              >
                {t("hero.signup_button")}
              </Text>
            </Pressable>
          </View>
        </View>
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
    maxWidth: 400, // Max width for content on larger screens
    flex: 1, // Allow hero content to take available space
  },
  appLogoText: {
    fontSize: 42, // Slightly reduced for better balance, still prominent
    fontWeight: "800", // Bolder font weight
    marginBottom: 20, // Reduced margin
    textAlign: "center",
    paddingHorizontal: 20,
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
    height: 320, // Slightly increased height for more image/text room
    width: viewportWidth,
    marginBottom: 25, // Increased space below carousel
  },
  carouselItem: {
    width: viewportWidth,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15, // Slightly reduced vertical padding for tighter fit
  },
  carouselImage: {
    width: "90%",
    height: 180, // Kept same
    marginBottom: 20, // Increased margin to separate image from title
    // If your images have transparent backgrounds, and you want a solid background
    // backgroundColor: 'transparent', // Ensure no unwanted background
  },
  carouselTitle: {
    fontSize: 24, // Slightly increased title size
    fontWeight: "700", // Bolder
    textAlign: "center",
    marginBottom: 8, // Reduced margin to bring description closer
  },
  carouselDescription: {
    fontSize: 15, // Slightly reduced for better hierarchy with title
    textAlign: "center",
    lineHeight: 22, // Adjusted line height
    paddingHorizontal: 10, // Added padding to description
  },
  paginationDotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40, // Increased space below dots
  },
  dot: {
    width: 8, // Slightly smaller dots
    height: 8,
    borderRadius: 4, // Fully rounded
    marginHorizontal: 5, // Slightly less margin
  },
  // --- Button Group ---
  buttonGroup: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 20, // Padding for the group itself
    marginTop: "auto", // Push button group to the bottom (within heroContent)
    marginBottom: 20, // Space from the bottom of the screen
  },
  // --- Button Styles ---
  button: {
    paddingVertical: 14, // Slightly reduced button height
    paddingHorizontal: 30,
    borderRadius: 8, // Slightly less rounded for a more modern look
    marginBottom: 12, // Reduced space between buttons
    width: "100%",
    maxWidth: 260, // Slightly reduced max width for a less "blocky" feel
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    fontSize: 17, // Slightly smaller text
    fontWeight: "700", // Bolder
  },
  secondaryButton: {
    borderWidth: 1.5, // Slightly thinner border
  },
  secondaryButtonText: {
    fontSize: 17,
    fontWeight: "700",
  },
  loadingText: {
    fontSize: 18,
    textAlign: "center",
  },
});

export default HeroScreen;
