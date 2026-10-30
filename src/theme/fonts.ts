/* Load only the weights the type scale uses. Importing the package entry
   pulls every weight into the web bundle. */
export const fontAssets = {
  Poppins_500Medium: require('@expo-google-fonts/poppins/500Medium/Poppins_500Medium.ttf'),
  Poppins_500Medium_Italic: require('@expo-google-fonts/poppins/500Medium_Italic/Poppins_500Medium_Italic.ttf'),
  Poppins_600SemiBold: require('@expo-google-fonts/poppins/600SemiBold/Poppins_600SemiBold.ttf'),
  Poppins_700Bold: require('@expo-google-fonts/poppins/700Bold/Poppins_700Bold.ttf'),
  Poppins_800ExtraBold: require('@expo-google-fonts/poppins/800ExtraBold/Poppins_800ExtraBold.ttf'),
  Inter_400Regular: require('@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf'),
  Inter_500Medium: require('@expo-google-fonts/inter/500Medium/Inter_500Medium.ttf'),
  Inter_600SemiBold: require('@expo-google-fonts/inter/600SemiBold/Inter_600SemiBold.ttf'),
  Inter_700Bold: require('@expo-google-fonts/inter/700Bold/Inter_700Bold.ttf'),
} as const;
