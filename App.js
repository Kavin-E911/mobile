import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';

// Get device width for responsive design
const { width } = Dimensions.get('window');

export default function App() {
  const [ingredients, setIngredients] = useState('');
  const [loading, setLoading] = useState(false);
  const [recipes, setRecipes] = useState([]);
  const [error, setError] = useState(null);
  
  // Animation value for button press
  const [buttonScale] = useState(new Animated.Value(1));

  // Button press animation
  const animateButton = () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  async function findRecipes() {
    setError(null);
    const query = ingredients.trim();
    if (!query) {
      setError('Please enter at least one ingredient');
      return;
    }

    setLoading(true);
    setRecipes([]);

    try {
      const encoded = encodeURIComponent(query);
      const url = `https://www.themealdb.com/api/json/v1/1/filter.php?i=${encoded}`;

      const res = await fetch(url);
      const data = await res.json();

      if (!data.meals) {
        setRecipes([]);
        setError('No recipes found for those ingredients. Try different words.');
        setLoading(false);
        return;
      }

      // Limit to 10 results for performance
      const limited = data.meals.slice(0, 10);

      // Fetch details for each meal in parallel
      const detailPromises = limited.map(m =>
        fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${m.idMeal}`).then(r => r.json())
      );

      const details = await Promise.all(detailPromises);

      // Map to objects we display
      const mapped = details.map(d => {
        const meal = d.meals[0];
        // create a short summary from the instructions (first 2 sentences)
        let summary = meal.strInstructions || '';
        summary = summary.split('.').slice(0, 2).join('.').trim();
        if (summary && !summary.endsWith('.')) summary += '.';

        return {
          id: meal.idMeal,
          name: meal.strMeal,
          thumbnail: meal.strMealThumb,
          summary,
          strCategory: meal.strCategory,
          strArea: meal.strArea,
          strTags: meal.strTags
        };
      });

      setRecipes(mapped);
    } catch (e) {
      console.error(e);
      setError('An error occurred while fetching recipes. Check your network.');
    } finally {
      setLoading(false);
    }
  }

  function renderItem({ item }) {
    return (
      <TouchableOpacity 
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => {
          // Add haptic feedback or additional functionality here
        }}
      >
        <View style={styles.cardInner}>
          {item.thumbnail ? (
            <Image 
              source={{ uri: item.thumbnail }} 
              style={styles.thumb}
              resizeMode="cover"
            />
          ) : null}
          <View style={styles.cardContent}>
            <Text style={styles.title}>{item.name}</Text>
            <View style={styles.categoryContainer}>
              <Text style={styles.category}>
                {item.strCategory || 'Main Course'}
              </Text>
              {item.strArea ? (
                <Text style={[styles.category, styles.categorySecondary]}>
                  {item.strArea}
                </Text>
              ) : null}
            </View>
            <Text style={styles.summary} numberOfLines={3}>
              {item.summary}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>MadRecipe</Text>
        <Text style={styles.subheader}>Find delicious recipes instantly</Text>
      </View>

      <View style={styles.searchSection}>
        <Text style={styles.label}>Enter ingredients (comma or space separated)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. chicken, rice, tomato"
          value={ingredients}
          onChangeText={setIngredients}
          autoCapitalize="none"
          placeholderTextColor="#999"
        />

        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
          <TouchableOpacity 
            style={styles.button} 
            onPress={() => {
              animateButton();
              findRecipes();
            }}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Searching...' : 'Find Recipes'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1e90ff" />
            <Text style={styles.loadingText}>Finding perfect recipes...</Text>
          </View>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      <FlatList
        style={styles.list}
        data={recipes}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerContainer: {
    backgroundColor: '#4a90e2',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subheader: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  searchSection: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    color: '#2c3e50',
    marginBottom: 10,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
    color: '#495057',
  },
  button: {
    backgroundColor: '#4a90e2',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#4a90e2',
    fontSize: 14,
  },
  error: {
    color: '#dc3545',
    marginTop: 10,
    textAlign: 'center',
    fontSize: 14,
  },
  list: {
    paddingHorizontal: 20,
  },
  listContent: {
    paddingBottom: 20,
  },
  card: {
    marginBottom: 15,
    borderRadius: 15,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
    overflow: 'hidden',
  },
  cardInner: {
    flexDirection: 'row',
    padding: 15,
  },
  thumb: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginRight: 15,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  categoryContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  category: {
    backgroundColor: '#e9ecef',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    fontSize: 12,
    color: '#495057',
    marginRight: 8,
  },
  categorySecondary: {
    backgroundColor: '#f8f9fa',
  },
  summary: {
    color: '#6c757d',
    fontSize: 14,
    lineHeight: 20,
  },
});
