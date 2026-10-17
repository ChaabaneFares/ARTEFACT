import type { Locale } from "@/i18n/routing";

export type FaqEntry = { id: string; question: string; answer: string };

const generalIds = [
  "qa1a1",
  "qa1a2",
  "qa1a3",
  "qa1a4",
  "qa1qa5",
  "qa1a6",
  "qa1a7",
  "qa1qa8",
  "qa1qa9",
  "qa1a10",
] as const;
const glossaryIds = [
  "q02t1a1",
  "q02t2a2",
  "q02t3a3",
  "q02t4a4",
  "q02t5a5",
  "q02t6a6",
  "q02t7a7",
  "q02t8a8",
  "q02t9a9",
  "q02t10a1",
] as const;

const en = {
  qa1a1: {
    question: "What type of payment do you accept?",
    answer:
      "Payment methods and terms are confirmed with your project proposal before work begins.",
  },
  qa1a2: {
    question: "Can I pay after I get the results?",
    answer:
      "Payment milestones are agreed as part of the project proposal. Please ask the studio about the terms that apply to your project.",
  },
  qa1a3: {
    question: "What is your turnaround time?",
    answer:
      "Turnaround depends on the scope of work, the number of views, project complexity and the materials provided. Please send a brief about your project along with documents, requirements and any preferred deadline. The studio can review the scope and discuss a suitable schedule before work begins. Timings are confirmed for each project rather than promised in advance.",
  },
  qa1a4: {
    question: "What are your working hours?",
    answer:
      "You can email the studio or leave a message at any time. Availability and meeting times can be arranged when we discuss your project.",
  },
  qa1qa5: {
    question: "Can you handle multiple projects together?",
    answer:
      "Please include the scope and deadlines for each project in your brief. The studio can review the combined workload and confirm availability for your requirements.",
  },
  qa1a6: {
    question: "What files do I need to send to start a project?",
    answer:
      "Generally, you can send us any kind of files, either hand sketches or even a video briefing. The most basic references are drawings, architectural or design sketches, and mood boards. If you have the exact idea for a project, you can send us everything you have. Ideally, we prefer to work with the following formats of files: - for plans and drawings – CAD format, pdf or any other vector format; - for ready 3D models – stl, 3ds, max, obj.",
  },
  qa1a7: {
    question: "How long does it take?",
    answer:
      "The time it takes to complete a project, depends on the scope of work and the complexity of a project. To determine the turnaround time for your project, please send us a brief description of your project along with any documents and requirements you have. We will calculate the TAT and inform you.",
  },
  qa1qa8: {
    question: "How much do 3D rendering services cost?",
    answer:
      "The cost of 3D rendering depends on the scope of work, the number of views and project complexity. Please send a brief with your documents and requirements so the studio can discuss a proposal for your project.",
  },
  qa1qa9: {
    question: "How much does it cost?",
    answer:
      "For a project estimate, please send a brief description along with any documents and requirements. The studio will review the scope and discuss a proposal with you.",
  },
  qa1a10: {
    question: "How do you guarantee the quality?",
    answer:
      "Your brief and agreed project scope establish the expected outputs. Please share references, materials and priorities so the studio can discuss the review process and any required revisions with you before work begins.",
  },
  q02t1a1: {
    question: "3D rendering",
    answer:
      "The process of generation of a photorealistic or non-photorealistic image with 3D models using 3D rendering software. The resulting product is called a 3D render.",
  },
  q02t2a2: {
    question: "Interior rendering",
    answer:
      "The process of generation of a photorealistic or non-photorealistic image with 3D models using 3D rendering software. The resulting product is called a 3D render.",
  },
  q02t3a3: {
    question: "Exterior rendering",
    answer:
      "The process of generation of a photorealistic or non-photorealistic image with 3D models using 3D rendering software. The resulting product is called a 3D render.",
  },
  q02t4a4: {
    question: "3D modeling",
    answer:
      "The process of creation of a representation of an object in three dimensions using 3D modeling software. The resulting product is called a 3D model.",
  },
  q02t5a5: {
    question: "3D animation",
    answer:
      "The process of generating three-dimensional videos in a digital environment. To create a 3D animation, 3D artists carefully manipulate 3D objects within 3D software for exporting sequences of still images. These CG pictures are then used together to create the illusion of movement in a 3D animation.",
  },
  q02t6a6: {
    question: "360° virtual tour",
    answer:
      "A collection of 360-degree panoramic rotating images, composed together to form a full, 360° view of a location.",
  },
  q02t7a7: {
    question: "Post-production",
    answer:
      "Compositing a photo into a CGI scene or retouching a 3D render to achieve maximum realism. It usually consists of adding visual effects and contextual elements such as cars and people.",
  },
  q02t8a8: {
    question: "VR tour",
    answer:
      "An artificial environment providing an interactive immersive experience through the simulation of sensory events, such as sight and sound. Objects are recreated digitally and placed in a virtual environment for the user to experience them like in real life — interact with them, see their features and benefits, change options, etc.",
  },
  q02t9a9: {
    question: "Floor plan",
    answer:
      "A drawing to scale, showing a view from above, of the relationships between rooms, spaces, traffic patterns, and other physical features at one level of a structure.",
  },
  q02t10a1: {
    question: "Draft visualization",
    answer:
      "With draft visualization, we can show you how a project looks before the final rendering. The quality of lighting, reflections, glossiness, and object materials in drafts are strongly reduced to save time and computer resources. Draft visualizations allow you to check the whole composition and every small detail of the project to make necessary corrections before the final rendering.",
  },
};

const faqText: Record<Locale, typeof en> = {
  en,
  fr: {
    qa1a1: {
      question: "Quels moyens de paiement acceptez-vous ?",
      answer:
        "Les moyens et conditions de paiement sont confirmés dans votre proposition de projet, avant le démarrage.",
    },
    qa1a2: {
      question: "Puis-je payer à la livraison ?",
      answer:
        "Les échéances de paiement sont fixées dans la proposition de projet. Renseignez-vous auprès du studio sur les conditions applicables à votre projet.",
    },
    qa1a3: {
      question: "Quels sont vos délais ?",
      answer:
        "Les délais dépendent du périmètre, du nombre de vues, de la complexité du projet et des éléments fournis. Envoyez un brief avec vos documents, vos besoins et la date souhaitée. Le studio pourra étudier le périmètre et convenir d’un calendrier adapté avant de commencer. Les délais sont confirmés projet par projet, et non promis à l’avance.",
    },
    qa1a4: {
      question: "Quels sont vos horaires ?",
      answer:
        "Vous pouvez écrire au studio ou laisser un message à tout moment. Les disponibilités et rendez-vous se définissent lors de nos échanges sur votre projet.",
    },
    qa1qa5: {
      question: "Gérez-vous plusieurs projets à la fois ?",
      answer:
        "Précisez le périmètre et les échéances de chaque projet dans votre brief. Le studio pourra évaluer la charge globale et confirmer ses disponibilités selon vos besoins.",
    },
    qa1a6: {
      question: "Quels fichiers fournir pour démarrer ?",
      answer:
        "Vous pouvez nous envoyer tout type de fichier, du croquis à la présentation vidéo. Les références de base sont les plans, les esquisses d’architecture ou de design et les moodboards. Si vous avez une idée précise, envoyez tout ce dont vous disposez. Nous privilégions ces formats : - plans et dessins : DAO (CAD), PDF ou autre format vectoriel ; - modèles 3D existants : stl, 3ds, max, obj.",
    },
    qa1a7: {
      question: "Quel délai prévoir ?",
      answer:
        "Le délai de réalisation dépend du périmètre et de la complexité du projet. Pour l’établir, envoyez un bref descriptif de votre projet avec vos documents et vos besoins. Nous calculerons le délai et vous le communiquerons.",
    },
    qa1qa8: {
      question: "Quel est le prix d’un rendu 3D ?",
      answer:
        "Le prix du rendu 3D dépend du périmètre, du nombre de vues et de la complexité du projet. Envoyez un brief avec vos documents et vos besoins pour que le studio puisse discuter d’une proposition adaptée.",
    },
    qa1qa9: {
      question: "Quels sont vos tarifs ?",
      answer:
        "Pour une estimation, envoyez un bref descriptif avec vos documents et vos besoins. Le studio étudiera le périmètre et discutera d’une proposition avec vous.",
    },
    qa1a10: {
      question: "Comment garantissez-vous la qualité ?",
      answer:
        "Votre brief et le périmètre convenu définissent les livrables attendus. Partagez vos références, vos documents et vos priorités afin que le studio puisse discuter avec vous du suivi et des révisions nécessaires avant de commencer.",
    },
    q02t1a1: {
      question: "Rendu 3D",
      answer:
        "Création d’une image photoréaliste ou non à partir de modèles 3D, à l’aide d’un logiciel de rendu 3D. Le résultat est appelé rendu 3D.",
    },
    q02t2a2: {
      question: "Rendu intérieur",
      answer:
        "Création d’une image photoréaliste ou non à partir de modèles 3D, à l’aide d’un logiciel de rendu 3D. Le résultat est appelé rendu 3D.",
    },
    q02t3a3: {
      question: "Rendu extérieur",
      answer:
        "Création d’une image photoréaliste ou non à partir de modèles 3D, à l’aide d’un logiciel de rendu 3D. Le résultat est appelé rendu 3D.",
    },
    q02t4a4: {
      question: "Modélisation 3D",
      answer:
        "Création d’une représentation d’un objet en trois dimensions à l’aide d’un logiciel de modélisation 3D. Le résultat est appelé modèle 3D.",
    },
    q02t5a5: {
      question: "Animation 3D",
      answer:
        "Création de vidéos en trois dimensions dans un environnement numérique. Les infographistes 3D manipulent avec soin des objets dans un logiciel 3D pour exporter des séquences d’images fixes. Ces images CG sont ensuite assemblées pour créer l’illusion du mouvement dans une animation 3D.",
    },
    q02t6a6: {
      question: "Visite à 360°",
      answer:
        "Un ensemble d’images panoramiques pivotantes à 360 degrés, assemblées pour offrir une vue complète à 360° d’un lieu.",
    },
    q02t7a7: {
      question: "Postproduction",
      answer:
        "Intégration d’une photo dans une scène CGI ou retouche d’un rendu 3D pour un réalisme maximal. Elle consiste généralement à ajouter des effets visuels et des éléments de contexte, comme des voitures et des personnes.",
    },
    q02t8a8: {
      question: "Visite VR",
      answer:
        "Un environnement artificiel offrant une expérience immersive et interactive par la simulation de stimuli sensoriels, comme l’image et le son. Des objets recréés numériquement y sont placés pour être explorés comme dans la réalité : interagir avec eux, découvrir leurs caractéristiques et avantages, modifier les options, etc.",
    },
    q02t9a9: {
      question: "Plan d’étage",
      answer:
        "Un dessin à l’échelle, vu du dessus, qui montre les relations entre pièces, espaces, circulations et autres éléments physiques d’un même niveau d’une construction.",
    },
    q02t10a1: {
      question: "Aperçu de rendu",
      answer:
        "L’aperçu permet de voir le projet avant le rendu final. La qualité de l’éclairage, des reflets, de la brillance et des matériaux y est fortement réduite pour économiser du temps et des ressources informatiques. Vous pouvez ainsi vérifier toute la composition et chaque détail du projet pour apporter les corrections nécessaires avant le rendu final.",
    },
  },
  es: {
    qa1a1: {
      question: "¿Qué formas de pago aceptan?",
      answer:
        "Los métodos y condiciones de pago se confirman en tu propuesta de proyecto antes de empezar.",
    },
    qa1a2: {
      question: "¿Puedo pagar a la entrega?",
      answer:
        "Los hitos de pago se acuerdan en la propuesta del proyecto. Consulta al estudio las condiciones que se aplican a tu proyecto.",
    },
    qa1a3: {
      question: "¿Cuál es el plazo de entrega?",
      answer:
        "El plazo depende del alcance, el número de vistas, la complejidad del proyecto y el material que nos envíes. Envía un brief con tus documentos, requisitos y la fecha deseada. El estudio podrá revisar el alcance y acordar un calendario adecuado antes de empezar. Los plazos se confirman para cada proyecto, sin prometerlos de antemano.",
    },
    qa1a4: {
      question: "¿Qué horario de trabajo tienen?",
      answer:
        "Puedes escribir al estudio o dejar un mensaje en cualquier momento. La disponibilidad y las reuniones se pueden acordar al hablar de tu proyecto.",
    },
    qa1qa5: {
      question: "¿Pueden llevar varios proyectos a la vez?",
      answer:
        "Incluye el alcance y los plazos de cada proyecto en tu brief. El estudio podrá evaluar la carga conjunta y confirmar su disponibilidad según tus requisitos.",
    },
    qa1a6: {
      question: "¿Qué archivos envío para iniciar un proyecto?",
      answer:
        "Puedes enviarnos cualquier tipo de archivo, desde bocetos a mano hasta un brief en video. Las referencias básicas son planos, bocetos de arquitectura o diseño y moodboards. Si tienes una idea precisa, envíanos todo lo que tengas. Preferimos estos formatos: - planos y dibujos: CAD, pdf u otro formato vectorial; - modelos 3D ya creados: stl, 3ds, max, obj.",
    },
    qa1a7: {
      question: "¿Cuánto se tarda?",
      answer:
        "El plazo para completar un proyecto depende del alcance y de su complejidad. Para determinar el de tu proyecto, envíanos una breve descripción con los documentos y requisitos que tengas. Calcularemos el plazo de entrega y te lo comunicaremos.",
    },
    qa1qa8: {
      question: "¿Cuánto cuesta el renderizado 3D?",
      answer:
        "El precio del renderizado 3D depende del alcance, el número de vistas y la complejidad del proyecto. Envía un brief con tus documentos y requisitos para que el estudio pueda hablar contigo de una propuesta.",
    },
    qa1qa9: {
      question: "¿Cuánto cuesta?",
      answer:
        "Para obtener un presupuesto, envía una breve descripción con tus documentos y requisitos. El estudio revisará el alcance y hablará contigo de una propuesta.",
    },
    qa1a10: {
      question: "¿Cómo garantizan la calidad?",
      answer:
        "Tu brief y el alcance acordado definen los entregables esperados. Comparte referencias, materiales y prioridades para que el estudio pueda hablar contigo del proceso de revisión y los cambios necesarios antes de empezar.",
    },
    q02t1a1: {
      question: "Renderizado 3D",
      answer:
        "Proceso de crear una imagen fotorrealista o no fotorrealista a partir de modelos 3D con software de renderizado 3D. El resultado se llama render 3D.",
    },
    q02t2a2: {
      question: "Render interior",
      answer:
        "Proceso de crear una imagen fotorrealista o no fotorrealista a partir de modelos 3D con software de renderizado 3D. El resultado se llama render 3D.",
    },
    q02t3a3: {
      question: "Render exterior",
      answer:
        "Proceso de crear una imagen fotorrealista o no fotorrealista a partir de modelos 3D con software de renderizado 3D. El resultado se llama render 3D.",
    },
    q02t4a4: {
      question: "Modelado 3D",
      answer:
        "Proceso de crear la representación de un objeto en tres dimensiones con software de modelado 3D. El resultado se llama modelo 3D.",
    },
    q02t5a5: {
      question: "Animación 3D",
      answer:
        "Proceso de generar videos tridimensionales en un entorno digital. Para crear una animación 3D, los artistas manipulan con cuidado objetos en software 3D y exportan secuencias de imágenes fijas. Estas imágenes CG se unen para crear la ilusión de movimiento en una animación 3D.",
    },
    q02t6a6: {
      question: "Tour virtual 360°",
      answer:
        "Un conjunto de imágenes panorámicas giratorias de 360 grados, unidas para formar una vista completa de 360° de un lugar.",
    },
    q02t7a7: {
      question: "Posproducción",
      answer:
        "Integración de una foto en una escena CGI o retoque de un render 3D para lograr el máximo realismo. Suele consistir en añadir efectos visuales y elementos de contexto, como vehículos y personas.",
    },
    q02t8a8: {
      question: "Tour VR",
      answer:
        "Un entorno artificial que ofrece una experiencia inmersiva e interactiva al simular percepciones como la vista y el sonido. Los objetos se recrean digitalmente y se sitúan en un entorno virtual para explorarlos como en la vida real: interactuar con ellos, ver sus características y ventajas, cambiar opciones, etc.",
    },
    q02t9a9: {
      question: "Planta",
      answer:
        "Un dibujo a escala, visto desde arriba, que muestra las relaciones entre habitaciones, espacios, circulaciones y otros elementos físicos de un mismo nivel de un edificio.",
    },
    q02t10a1: {
      question: "Render preliminar",
      answer:
        "El render preliminar permite ver un proyecto antes del renderizado final. La calidad de la iluminación, los reflejos, el brillo y los materiales se reduce mucho para ahorrar tiempo y recursos informáticos. Así puedes comprobar toda la composición y cada detalle del proyecto y hacer las correcciones necesarias antes del renderizado final.",
    },
  },
  ar: {
    qa1a1: {
      question: "ما طرق الدفع التي تقبلونها؟",
      answer: "تُؤكّد طرق الدفع وشروطه ضمن عرض مشروعك قبل بدء العمل.",
    },
    qa1a2: {
      question: "هل يمكنني الدفع بعد استلام النتائج؟",
      answer:
        "يُتّفق على مراحل الدفع ضمن عرض المشروع. يُرجى سؤال الاستوديو عن الشروط التي تنطبق على مشروعك.",
    },
    qa1a3: {
      question: "ما مدة التسليم؟",
      answer:
        "تعتمد المدة على نطاق العمل وعدد اللقطات وتعقيد المشروع والمواد المقدّمة. أرسل موجزًا عن مشروعك مع المستندات والمتطلبات والموعد المفضّل للتسليم. يمكن للاستوديو مراجعة النطاق ومناقشة جدول مناسب قبل بدء العمل. تُؤكّد المواعيد لكل مشروع دون وعود مسبقة.",
    },
    qa1a4: {
      question: "ما ساعات عملكم؟",
      answer:
        "يمكنك مراسلة الاستوديو بالبريد الإلكتروني أو ترك رسالة في أي وقت. ويمكن الاتفاق على الأوقات المتاحة ومواعيد الاجتماعات عند مناقشة مشروعك.",
    },
    qa1qa5: {
      question: "هل تنفّذون عدة مشاريع معًا؟",
      answer:
        "أدرج نطاق كل مشروع ومواعيده في الموجز. يمكن للاستوديو مراجعة إجمالي حجم العمل وتأكيد مدى توفّره لتلبية متطلباتك.",
    },
    qa1a6: {
      question: "ما الملفات اللازمة لبدء المشروع؟",
      answer:
        "يمكنك إرسال أي نوع من الملفات، من الرسومات اليدوية إلى موجز بالفيديو. وتشمل المراجع الأساسية المخططات والرسومات المعمارية أو التصميمية ولوحات الإلهام. إذا كانت لديك فكرة دقيقة، فأرسل كل ما لديك. ونفضّل الصيغ التالية: - للمخططات والرسومات: CAD أو pdf أو أي صيغة متجهية؛ - لنماذج 3D الجاهزة: stl، 3ds، max، obj.",
    },
    qa1a7: {
      question: "كم يستغرق العمل؟",
      answer:
        "تعتمد مدة إنجاز المشروع على نطاق العمل وتعقيد المشروع. لتحديد مدة مشروعك، أرسل وصفًا موجزًا مع ما لديك من مستندات ومتطلبات. سنحسب مدة التسليم ونبلغك بها.",
    },
    qa1qa8: {
      question: "كم تبلغ تكلفة التصيير 3D؟",
      answer:
        "تعتمد تكلفة التصيير 3D على نطاق العمل وعدد اللقطات وتعقيد المشروع. أرسل موجزًا مع مستنداتك ومتطلباتك ليتمكّن الاستوديو من مناقشة عرض لمشروعك.",
    },
    qa1qa9: {
      question: "كم تبلغ التكلفة؟",
      answer:
        "للحصول على تقدير للتكلفة، أرسل وصفًا موجزًا مع مستنداتك ومتطلباتك. سيراجع الاستوديو نطاق العمل ويناقش العرض معك.",
    },
    qa1a10: {
      question: "كيف تضمنون الجودة؟",
      answer:
        "يحدّد موجزك ونطاق المشروع المتّفق عليه المخرجات المتوقعة. شارك المراجع والمواد والأولويات ليتسنّى للاستوديو مناقشة آلية المراجعة والتعديلات المطلوبة معك قبل بدء العمل.",
    },
    q02t1a1: {
      question: "تصيير 3D",
      answer:
        "عملية إنشاء صورة واقعية أو غير واقعية انطلاقًا من نماذج 3D باستخدام برامج التصيير 3D. وتُسمّى الصورة الناتجة صورةً مُصيَّرة 3D.",
    },
    q02t2a2: {
      question: "تصيير داخلي",
      answer:
        "عملية إنشاء صورة واقعية أو غير واقعية انطلاقًا من نماذج 3D باستخدام برامج التصيير 3D. وتُسمّى الصورة الناتجة صورةً مُصيَّرة 3D.",
    },
    q02t3a3: {
      question: "تصيير خارجي",
      answer:
        "عملية إنشاء صورة واقعية أو غير واقعية انطلاقًا من نماذج 3D باستخدام برامج التصيير 3D. وتُسمّى الصورة الناتجة صورةً مُصيَّرة 3D.",
    },
    q02t4a4: {
      question: "نمذجة 3D",
      answer:
        "عملية إنشاء تمثيل لجسم بأبعاده الثلاثة باستخدام برامج النمذجة 3D. ويُسمّى الناتج نموذجًا 3D.",
    },
    q02t5a5: {
      question: "تحريك 3D",
      answer:
        "عملية إنتاج مقاطع فيديو ثلاثية الأبعاد في بيئة رقمية. لإنشاء تحريك 3D، يحرّك الفنانون أجسامًا بعناية داخل برامج 3D لتصدير تسلسلات من الصور الثابتة. ثم تُجمع صور CG هذه لخلق الإيهام بالحركة في التحريك 3D.",
    },
    q02t6a6: {
      question: "جولة افتراضية 360°",
      answer:
        "مجموعة من الصور البانورامية الدوّارة بزاوية 360 درجة، تُجمع لتشكّل إطلالة كاملة بزاوية 360° لمكان ما.",
    },
    q02t7a7: {
      question: "ما بعد الإنتاج",
      answer:
        "دمج صورة فوتوغرافية في مشهد CGI أو تنقيح تصيير 3D لتحقيق أقصى واقعية. وتشمل العملية عادة إضافة مؤثرات بصرية وعناصر من المحيط كالسيارات والأشخاص.",
    },
    q02t8a8: {
      question: "جولة VR",
      answer:
        "بيئة اصطناعية توفّر تجربة تفاعلية غامرة عبر محاكاة إدراكات حسية كالبصر والسمع. تُعاد صناعة الأجسام رقميًا وتوضع في بيئة افتراضية ليختبرها المستخدم كما في الواقع، فيتفاعل معها ويرى خصائصها ومزاياها ويغيّر الخيارات وغيرها.",
    },
    q02t9a9: {
      question: "مسقط أفقي",
      answer:
        "رسم بمقياس محدّد يُظهر من الأعلى العلاقات بين الغرف والمساحات ومسارات الحركة وغيرها من العناصر المادية في مستوى واحد من المبنى.",
    },
    q02t10a1: {
      question: "إظهار أولي",
      answer:
        "يتيح الإظهار الأولي رؤية المشروع قبل التصيير النهائي. تُخفّض فيه جودة الإضاءة والانعكاسات واللمعان ومواد الأجسام بدرجة كبيرة لتوفير الوقت والموارد الحاسوبية. ويمكنك بذلك مراجعة التكوين كاملًا وكل تفصيل صغير في المشروع وإجراء التصحيحات اللازمة قبل التصيير النهائي.",
    },
  },
};

export function getGeneralQuestions(locale: Locale): readonly FaqEntry[] {
  return generalIds.map((id) => ({ id, ...faqText[locale][id] }));
}

export function getGlossaryQuestions(locale: Locale): readonly FaqEntry[] {
  return glossaryIds.map((id) => ({ id, ...faqText[locale][id] }));
}
