import type { VSliderItem } from "@/components/ui/VSlider/Vslider.types";
import { type Locale, localizePath } from "@/i18n/routing";

const structure = [
  {
    id: "interior",
    href: "/projects#In",
    image: "/assets/landing-page/designs/vertical-slider/interior.jpg",
  },
  {
    id: "exterior",
    href: "/projects#Ex",
    image: "/assets/landing-page/designs/vertical-slider/exterior.jpg",
  },
  {
    id: "rendering",
    href: "/projects#3dr",
    image: "/assets/landing-page/visualization/vertical-slider/render.jpg",
  },
  {
    id: "animation",
    href: "/projects#Ani",
    image: "/assets/landing-page/visualization/vertical-slider/animation.jpg",
  },
  {
    id: "virtual-tour",
    href: "/projects#VR",
    image:
      "/assets/landing-page/visualization/vertical-slider/virtual-tour.jpg",
  },
] as const;

const en = {
  interior: {
    title: "Interior design",
    description:
      "People want to feel good in a space. We can make it happen by creating environments that are pleasing, aesthetic, and functional.",
    label: "Interior",
    linkLabel: "View Interior design projects",
  },
  exterior: {
    title: "Exterior design",
    description:
      "Our responsibility to a project extends beyond the walls of the building. We always seize the opportunity to maximize the relationship between the structure and its external context.",
    label: "Exterior",
    linkLabel: "View Exterior design projects",
  },
  rendering: {
    title: "3D Rendering",
    description:
      "Photorealistic 3D rendering is a process performed by CGI artists with the help of professional software. The results of this process are photo-like 2D visuals. In the context of architecture, those visuals depict interiors and exteriors of buildings that are yet to be constructed.",
    label: "Rendering",
    linkLabel: "View 3D Rendering projects",
  },
  animation: {
    title: "CG Animation",
    description:
      "The architectural movie provides a highly immersive experience for presentation and property marketing. It shows surroundings, interior and exterior design, and walks the viewer through the property as if it were already built.",
    label: "Animation",
    linkLabel: "View CG Animation projects",
  },
  "virtual-tour": {
    title: "Virtual tour",
    description:
      "A CGI platform that allows real estate professionals to give prospects and clients self-guided tours of properties and designs. The tours can also be VR-compatible and include information about the interior design products used.",
    label: "Virtual Tour",
    linkLabel: "View Virtual tour projects",
  },
};

const serviceText: Record<Locale, typeof en> = {
  en,
  fr: {
    interior: {
      title: "Intérieur",
      description:
        "Nous créons des espaces où il fait bon vivre, en alliant bien-être, esthétique et fonctionnalité.",
      label: "Intérieur",
      linkLabel: "Voir les projets d’intérieur",
    },
    exterior: {
      title: "Extérieur",
      description:
        "Notre responsabilité dépasse les murs du bâtiment. Nous saisissons chaque occasion de renforcer le lien entre l’édifice et son contexte.",
      label: "Extérieur",
      linkLabel: "Voir les projets d’extérieur",
    },
    rendering: {
      title: "Rendu 3D",
      description:
        "Le rendu 3D photoréaliste est réalisé par des infographistes 3D avec des logiciels professionnels. Il produit des images 2D proches de la photographie. En architecture, ces images représentent les intérieurs et extérieurs de bâtiments encore à construire.",
      label: "Rendu",
      linkLabel: "Voir les projets de rendu 3D",
    },
    animation: {
      title: "Animation CG",
      description:
        "Le film architectural offre une expérience immersive pour la présentation et la promotion immobilière. Il montre les abords, le design intérieur et extérieur, et guide le spectateur dans le bien comme s’il était déjà construit.",
      label: "Animation",
      linkLabel: "Voir les projets d’animation CG",
    },
    "virtual-tour": {
      title: "Visite virtuelle",
      description:
        "Une plateforme CGI qui permet aux professionnels de l’immobilier de proposer des visites autonomes de biens et de projets aux prospects et clients. Ces visites peuvent être compatibles VR et présenter les produits utilisés dans le design intérieur.",
      label: "Visite 360°",
      linkLabel: "Voir les visites virtuelles",
    },
  },
  es: {
    interior: {
      title: "Interior",
      description:
        "Todos queremos sentirnos bien en un espacio. Lo hacemos posible creando ambientes agradables, estéticos y funcionales.",
      label: "Interior",
      linkLabel: "Ver proyectos de interior",
    },
    exterior: {
      title: "Exterior",
      description:
        "Nuestra responsabilidad va más allá de las paredes del edificio. Siempre aprovechamos la ocasión para potenciar la relación entre la estructura y su entorno exterior.",
      label: "Exterior",
      linkLabel: "Ver proyectos de exterior",
    },
    rendering: {
      title: "Render 3D",
      description:
        "El renderizado 3D fotorrealista lo realizan artistas CGI con software profesional. El resultado son imágenes 2D de aspecto fotográfico. En arquitectura, estas imágenes muestran interiores y exteriores de edificios que aún no se han construido.",
      label: "Render",
      linkLabel: "Ver proyectos de render 3D",
    },
    animation: {
      title: "Animación CG",
      description:
        "El video arquitectónico ofrece una experiencia inmersiva para la presentación y promoción inmobiliaria. Muestra el entorno y el diseño interior y exterior, y guía al espectador por la propiedad como si ya estuviera construida.",
      label: "Animación",
      linkLabel: "Ver proyectos de animación CG",
    },
    "virtual-tour": {
      title: "Tour virtual",
      description:
        "Una plataforma CGI que permite a los profesionales inmobiliarios ofrecer a clientes e interesados tours autoguiados por propiedades y diseños. Los tours también pueden ser compatibles con VR e incluir información sobre los productos de diseño interior utilizados.",
      label: "Tour virtual",
      linkLabel: "Ver proyectos de tour virtual",
    },
  },
  ar: {
    interior: {
      title: "تصميم داخلي",
      description:
        "يرغب الناس في الشعور بالراحة في المكان، ونحقق ذلك بابتكار بيئات مريحة وجميلة وعملية.",
      label: "داخلي",
      linkLabel: "عرض مشاريع التصميم الداخلي",
    },
    exterior: {
      title: "تصميم خارجي",
      description:
        "تمتد مسؤوليتنا عن المشروع إلى ما وراء جدران المبنى. ونغتنم كل فرصة لتعزيز العلاقة بين المبنى ومحيطه الخارجي.",
      label: "خارجي",
      linkLabel: "عرض مشاريع التصميم الخارجي",
    },
    rendering: {
      title: "تصيير 3D",
      description:
        "ينفّذ فنانو CGI التصيير الواقعي بتقنية 3D باستخدام برامج احترافية، لينتجوا صورًا ثنائية الأبعاد تحاكي الصور الفوتوغرافية. وفي العمارة، تعرض هذه الصور المساحات الداخلية والواجهات لمبانٍ لم تُشيّد بعد.",
      label: "تصيير",
      linkLabel: "عرض مشاريع التصيير 3D",
    },
    animation: {
      title: "تحريك CG",
      description:
        "يقدّم الفيلم المعماري تجربة غامرة للعرض والتسويق العقاري. ويُظهر المحيط والتصميم الداخلي والخارجي، ويأخذ المشاهد في جولة داخل العقار كما لو كان قد بُني بالفعل.",
      label: "تحريك",
      linkLabel: "عرض مشاريع التحريك CG",
    },
    "virtual-tour": {
      title: "جولة افتراضية",
      description:
        "منصة CGI تتيح للعاملين في القطاع العقاري تقديم جولات ذاتية التوجيه داخل العقارات والتصاميم لعملائهم الحاليين والمحتملين. ويمكن أن تدعم الجولات تقنية VR وتتضمن معلومات عن منتجات التصميم الداخلي المستخدمة.",
      label: "جولة افتراضية",
      linkLabel: "عرض مشاريع الجولات الافتراضية",
    },
  },
};

export function getServices(locale: Locale): readonly VSliderItem[] {
  return structure.map((item) => ({
    ...item,
    ...serviceText[locale][item.id],
    href: localizePath(item.href, locale),
  }));
}

export function getServiceLinks(locale: Locale) {
  return structure.map(({ id }) => ({
    id,
    label: serviceText[locale][id].label,
  }));
}
