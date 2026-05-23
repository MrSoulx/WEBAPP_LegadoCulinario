import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'es',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    resources: {
      es: {
        translation: {
          "nav": {
            "recipes": "Recetas",
            "about": "Acerca de",
            "suggestions": "Sugerencias",
            "contact": "Contacto",
            "home": "Inicio",
            "region_costa": "Costa",
            "region_sierra": "Sierra",
            "region_oriente": "Oriente",
            "region_insular": "Insular"
          },
          "home": {
            "hero_title_p1": "Explora la",
            "hero_title_p2": "gastronomía ecuatoriana",
            "hero_subtitle": "Selecciona una región en el mapa para descubrir sus recetas tradicionales",
            "filter_by_province": "Filtrar por provincia:",
            "view_all": "Ver todas",
            "all": "Todas",
            "share_recipe": "¡Comparte una receta!",
            "cta_title": "¿Tienes una receta ecuatoriana que compartir?",
            "cta_subtitle": "Comparte tus recetas tradicionales y ayúdanos a preservar la gastronomía ecuatoriana",
            "cta_button": "Compartir receta",
            "select_region": "Selecciona la región"
          },
          "recipes": {
            "title": "Recetario Tradicional",
            "search_placeholder": "Buscar recetas...",
            "no_results": "No se encontraron recetas que coincidan con tu búsqueda.",
            "no_available": "No hay recetas disponibles",
            "no_results_desc": "Aún no tenemos recetas registradas para esta región en nuestra base de datos.",
            "error_loading": "No se pudieron cargar las recetas.",
            "back": "Volver",
            "found_count": "recetas encontradas",
            "subtitle": "Explora recetas tradicionales de todo el Ecuador"
          },
          "about": {
            "header": "Acerca de Culinario Ecuador",
            "p1": "Bienvenidos a Legado Culinario, una plataforma dedicada a preservar y compartir las ricas tradiciones gastronómicas de Ecuador con el mundo.",
            "sub_legacy": "Legado Culinario",
            "p2": "Queremos que visitantes de todo el mundo descubran la auténtica cocina ecuatoriana, organizada por las 4 regiones naturales y las 24 provincias del país.",
            "sub_regions": "Las Cuatro Regiones",
            "reg_costa": "Costa: 7 provincias junto al Océano Pacífico",
            "reg_sierra": "Sierra: 10 provincias en la cordillera de los Andes",
            "reg_oriente": "Oriente: 6 provincias en la Amazonía ecuatoriana",
            "reg_insular": "Insular: Las únicas Islas Galápagos",
            "sub_diversity": "Diversidad Culinaria",
            "p3": "Cada región de Ecuador ofrece ingredientes y técnicas culinarias únicas, influenciadas por su geografía, clima y herencia cultural.",
            "sub_world": "Para el Mundo",
            "p4": "Esta plataforma cuenta con soporte multi-idioma para que viajeros de todo el mundo puedan conocer y preparar auténticas recetas ecuatorianas."
          },
          "suggestions": {
            "title": "Comparte tu receta",
            "subtitle": "Ayúdanos a preservar las tradiciones culinarias ecuatorianas compartiendo tus recetas",
            "form_recipe_name": "Nombre de la receta *",
            "form_region": "Región *",
            "form_province": "Provincia *",
            "form_description": "Descripción breve *",
            "form_ingredients": "Ingredientes * (uno por línea)",
            "form_instructions": "Instrucciones de preparación *",
            "form_submit": "Enviar receta",
            "select_province": "Selecciona...",
            "alert_success": "¡Gracias por compartir tu receta! La revisaremos pronto."
          },
          "footer": {
            "description": "Preservando las tradiciones gastronómicas de Ecuador",
            "regions": "Regiones",
            "links": "Enlaces",
            "made_with": "Hecho con ❤️ para el mundo"
          },
          "common": {
            "back_to_map": "Regresar al Mapa Completo",
            "recipes_of": "Recetas de la",
            "province": "Provincia",
            "region": "Región",
            "difficulty": "Dificultad",
            "time": "Tiempo",
            "servings": "Porciones",
            "ingredients": "Ingredientes",
            "preparation": "Preparación",
            "how_to_serve": "Cómo Servir",
            "comments": "Comentarios y valoraciones",
            "add_comment": "Añadir comentario",
            "name": "Nombre",
            "email": "Correo",
            "send": "Enviar",
            "loading": "Cargando...",
            "view_recipe": "Ver receta",
            "start": "Iniciar"
          }
        }
      },
      en: {
        translation: {
          "nav": {
            "recipes": "Recipes",
            "about": "About",
            "suggestions": "Suggestions",
            "contact": "Contact",
            "home": "Home",
            "region_costa": "Coast",
            "region_sierra": "Highlands",
            "region_oriente": "Amazon",
            "region_insular": "Islands"
          },
          "home": {
            "hero_title_p1": "Explore",
            "hero_title_p2": "Ecuadorian Gastronomy",
            "hero_subtitle": "Select a region on the map to discover its traditional recipes",
            "filter_by_province": "Filter by Province:",
            "view_all": "View All",
            "all": "All",
            "share_recipe": "Share a recipe!",
            "cta_title": "Do you have an Ecuadorian recipe to share?",
            "cta_subtitle": "Share your traditional recipes and help us preserve Ecuadorian gastronomy",
            "cta_button": "Share Recipe",
            "select_region": "Select Region"
          },
          "recipes": {
            "title": "Traditional Cookbook",
            "search_placeholder": "Search recipes...",
            "no_results": "No recipes found matching your search.",
            "no_available": "No recipes available",
            "no_results_desc": "We don't have recipes registered for this region in our database yet.",
            "error_loading": "Could not load recipes.",
            "back": "Back",
            "found_count": "recipes found",
            "subtitle": "Explore traditional recipes from all over Ecuador"
          },
          "about": {
            "header": "About Ecuador Culinary",
            "p1": "Welcome to Culinary Legacy, a platform dedicated to preserving and sharing the rich gastronomic traditions of Ecuador with the world.",
            "sub_legacy": "Culinary Legacy",
            "p2": "We want visitors from all over the world to discover authentic Ecuadorian cuisine, organized by the 4 natural regions and 24 provinces of the country.",
            "sub_regions": "The Four Regions",
            "reg_costa": "Coast: 7 provinces along the Pacific Ocean",
            "reg_sierra": "Highlands: 10 provinces in the Andes mountains",
            "reg_oriente": "Amazon: 6 provinces in the Ecuadorian Amazon",
            "reg_insular": "Islands: The unique Galapagos Islands",
            "sub_diversity": "Culinary Diversity",
            "p3": "Each region of Ecuador offers unique ingredients and culinary techniques, influenced by its geography, climate, and cultural heritage.",
            "sub_world": "For the World",
            "p4": "This platform features multi-language support so that travelers from around the world can learn about and prepare authentic Ecuadorian recipes."
          },
          "suggestions": {
            "title": "Share your recipe",
            "subtitle": "Help us preserve Ecuadorian culinary traditions by sharing your recipes",
            "form_recipe_name": "Recipe name *",
            "form_region": "Region *",
            "form_province": "Province *",
            "form_description": "Short description *",
            "form_ingredients": "Ingredients * (one per line)",
            "form_instructions": "Preparation instructions *",
            "form_submit": "Submit recipe",
            "select_province": "Select...",
            "alert_success": "Thank you for sharing your recipe! We will review it soon."
          },
          "footer": {
            "description": "Preserving the culinary traditions of Ecuador",
            "regions": "Regions",
            "links": "Links",
            "made_with": "Made with ❤️ for the world"
          },
          "common": {
            "back_to_map": "Back to Full Map",
            "recipes_of": "Recipes from the",
            "province": "Province",
            "region": "Region",
            "difficulty": "Difficulty",
            "time": "Time",
            "servings": "Servings",
            "ingredients": "Ingredients",
            "preparation": "Preparation",
            "how_to_serve": "How to Serve",
            "comments": "Comments and ratings",
            "add_comment": "Add comment",
            "name": "Name",
            "email": "Email",
            "send": "Send",
            "loading": "Loading...",
            "view_recipe": "View recipe",
            "start": "Start"
          }
        }
      }
    }
  });

export default i18n;
