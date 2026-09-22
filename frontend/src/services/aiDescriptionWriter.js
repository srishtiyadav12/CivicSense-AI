/**
 * Simple AI Description Writer
 * Uses predefined templates to generate complaint descriptions
 */

const COMPLAINT_TEMPLATES = {
  pothole: [
    {
      title: 'Large Pothole on Road Needs Urgent Repair',
      description: 'There is a large pothole on the road that poses a serious danger to vehicles and pedestrians. The road surface has deteriorated significantly at this location, creating a hazard for traffic. This pothole has been causing inconvenience and potential accidents. Immediate repair is required to prevent vehicle damage and ensure public safety.'
    },
    {
      title: 'Dangerous Pothole Causing Traffic Issues',
      description: 'A dangerous pothole has formed on the road surface, causing vehicles to swerve and creating a traffic hazard. The pothole is deep enough to cause damage to vehicles and poses a risk to two-wheelers. The situation worsens during rain when the pothole fills with water. Urgent attention from the Public Works Department is needed.'
    }
  ],

  garbage: [
    {
      title: 'Garbage Accumulation Needs Immediate Cleaning',
      description: 'There is significant garbage accumulation at this location that is causing hygiene and health issues. The waste has been piling up for several days, attracting flies and stray animals. This is creating an unhygienic environment for nearby residents and pedestrians. The Sanitation Department should clear this garbage immediately and ensure regular collection.'
    },
    {
      title: 'Overflowing Garbage Bins Creating Health Hazard',
      description: 'The garbage bins at this location are overflowing and waste is scattered around the area. This is creating a foul smell and unsanitary conditions. The accumulated garbage is attracting pests and causing health concerns for the community. Regular cleaning and more frequent garbage collection are urgently needed.'
    }
  ],

  broken_streetlight: [
    {
      title: 'Streetlight Not Working - Safety Concern',
      description: 'The streetlight at this location is not functioning, making the area very dark and unsafe at night. This poses a security risk for pedestrians and residents, especially women and children. The lack of proper lighting also increases the risk of accidents. The Electricity Board should repair or replace this streetlight urgently.'
    },
    {
      title: 'Non-Functional Streetlight Needs Repair',
      description: 'The streetlight has not been working for several days, creating darkness in this area during night hours. This is causing inconvenience and safety concerns for people passing through. The area has become prone to accidents due to poor visibility. Immediate repair is requested to restore proper lighting.'
    }
  ],

  water_leakage: [
    {
      title: 'Water Leakage from Pipeline - Water Wastage',
      description: 'There is continuous water leakage from the pipeline at this location, causing significant water wastage. The leaking water has created a pool on the road, making it slippery and dangerous for pedestrians. This wastage of precious water resources is unacceptable. The Water Supply Department should fix this leak immediately.'
    },
    {
      title: 'Burst Water Pipe Causing Road Flooding',
      description: 'A water pipe has burst at this location, causing water to flood the road continuously. This is not only wasting large amounts of water but also creating problems for traffic and pedestrians. The road has become muddy and slippery due to the water accumulation. Urgent repair work is needed to stop this wastage.'
    }
  ],

  drainage: [
    {
      title: 'Blocked Drainage Causing Water Stagnation',
      description: 'The drainage system at this location is completely blocked, causing water to stagnate on the road. During rains, the situation worsens with water flooding the area. The stagnant water is becoming a breeding ground for mosquitoes and creating health hazards. The Drainage Department needs to clear the blockage and ensure proper water flow.'
    },
    {
      title: 'Overflowing Drain Creating Unhygienic Conditions',
      description: 'The drain is overflowing and sewage water is spreading on the road. This is creating extremely unhygienic conditions and a foul smell in the area. The overflow is affecting nearby homes and businesses. Immediate action is required to clean and repair the drainage system to prevent health hazards.'
    }
  ],

  damaged_infrastructure: [
    {
      title: 'Damaged Infrastructure Needs Repair',
      description: 'The infrastructure at this location is damaged and in poor condition. This poses a safety risk to the public and affects the aesthetics of the area. The damage has been worsening over time and needs immediate attention. The Public Works Department should carry out necessary repairs to restore the structure.'
    },
    {
      title: 'Broken Public Property Requires Attention',
      description: 'Public property at this location is broken and damaged, creating inconvenience for citizens. The damaged structure could cause injuries and is an eyesore in the community. Repairs are long overdue and should be undertaken immediately to ensure public safety and maintain the area properly.'
    }
  ],

  stray_animals: [
    {
      title: 'Stray Animals Creating Safety Issues',
      description: 'There are stray animals roaming freely in this area, creating safety concerns for residents, especially children. The animals sometimes block roads and cause disturbances. There have been instances of these animals chasing people and creating panic. Animal Control should address this situation and ensure public safety.'
    }
  ],

  electricity: [
    {
      title: 'Exposed Electrical Wires - Danger to Public',
      description: 'There are exposed electrical wires hanging dangerously at this location. This poses a serious risk of electrocution to people passing by, especially during rain or windy conditions. This is an extremely hazardous situation that requires immediate attention from the Electricity Board to prevent potential accidents.'
    }
  ],

  road_damage: [
    {
      title: 'Road Surface Damaged - Needs Repair',
      description: 'The road surface at this location is severely damaged with cracks and uneven patches. This is causing difficulty for vehicles and discomfort for passengers. The damaged road also poses risks to two-wheelers. The Public Works Department should resurface this road section to improve driving conditions.'
    }
  ],

  other: [
    {
      title: 'Civic Issue Requires Attention',
      description: 'There is a civic infrastructure issue at this location that requires attention from the relevant authorities. This problem is causing inconvenience to residents and needs to be addressed promptly to maintain public facilities and ensure smooth functioning of civic services in the area.'
    }
  ]
};

/**
 * Generate AI complaint based on selected type
 * @param {string} type - Complaint type (pothole, garbage, etc.)
 * @returns {Object} Generated complaint with title and description
 */
export function generateComplaintDescription(type = 'other') {
  const templates = COMPLAINT_TEMPLATES[type] || COMPLAINT_TEMPLATES.other;

  // Pick a random template from available options
  const randomIndex = Math.floor(Math.random() * templates.length);
  const template = templates[randomIndex];

  return {
    title: template.title,
    description: template.description,
    type: type,
    generatedAt: new Date().toISOString()
  };
}

/**
 * Get all available complaint types
 */
export function getComplaintTypes() {
  return Object.keys(COMPLAINT_TEMPLATES).filter(key => key !== 'other');
}

export default {
  generateComplaintDescription,
  getComplaintTypes
};