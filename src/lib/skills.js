export function skillsForRole(groups, role = 'all') {
  return groups
    .map((group) => ({
      group: group.group,
      skills: group.skills
        .filter((skill) => typeof skill === 'string' || role === 'all' || skill.roles?.includes(role))
        .map((skill) => typeof skill === 'string' ? skill : skill.name),
    }))
    .filter((group) => group.skills.length > 0)
}
