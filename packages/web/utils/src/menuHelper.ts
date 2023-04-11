import type { Menu, MenuModule } from "@celeris/types";
import { loadDataFromModules } from "./moduleHelper";
import { findFirstNodePath } from "./treeHelper";
import { isHttpUrl } from "./typeChecks";

/**
 * 从模块对象中加载菜单配置并加入到菜单集合中
 * Load menu configurations from modules and add them to a menu collection
 * @param modules 包含模块的对象 Object containing modules
 * @returns 加载后的菜单配置数组 Loaded menu configuration array
 */
export function loadMenusFromModules(modules: Record<string, { default: any }>): MenuModule[] {
  return loadDataFromModules<MenuModule>(modules);
}

/**
 * 递归函数，将所有菜单项的路径与其父路径进行拼接。
 * 如果某个菜单项的路径不是以 / 或 http(s):// 开头，则会将其与父路径拼接。
 * 如果该菜单项有子菜单，则会递归处理其子菜单。
 *
 * A recursive function that concatenates the path of all menu items with their parent path.
 * If the path of a menu item does not start with / or http(s)://, it will be concatenated with the parent path.
 * If the menu item has child menus, the function will handle its child menus recursively.
 *
 * @param menus 菜单项列表
 *              A list of menu items
 * @param parentPath 父路径
 *                   Parent path
 */
function joinParentPath(menus: Menu[], parentPath = ""): void {
  for (const menu of menus) {
    // https://next.router.vuejs.org/guide/essentials/nested-routes.html
    // 如果路径不是以 / 或 http(s):// 开头，则需要将其与父路径拼接
    // If the path of the menu item does not start with / or http(s)://, it needs to be concatenated with the parent path
    if (!(menu.path.startsWith("/") && !isHttpUrl(menu.path))) {
      // 将父路径与菜单项的路径进行拼接
      // Concatenate the parent path with the path of the menu item
      menu.path = `${parentPath}/${menu.path}`;
    }

    // 如果该菜单项有子菜单，则需要递归处理其子菜单
    // If the menu item has child menus, the function will handle its child menus recursively
    if (menu?.children?.length) {
      // 如果该菜单项的 meta.hidePathForChildren 为 true，则将其子菜单的父路径设为当前路径
      // If the meta.hidePathForChildren of the menu item is true, the parent path of its child menus is set to the current path
      // 否则，将其子菜单的父路径设为该菜单项的路径
      // Otherwise, the parent path of its child menus is set to the path of the menu item
      const childParentPath = menu.meta?.shouldHidePathForChildrenRouter ? parentPath : menu.path;
      joinParentPath(menu.children, childParentPath);
    }
  }
}

/**
 * Transforms a MenuModule object into a Menu object by joining the parent path of its menu items.
 *
 * @param menuModule The MenuModule object to transform
 * @returns The transformed Menu object
 */
export function transformMenuModule(menuModule: MenuModule): Menu {
  const menuList = [menuModule.menu];
  joinParentPath(menuList);
  return menuList[0];
}

/**
 * Get all parent paths of the node in the tree that matches the given path.
 * 获取树形结构中与给定路径匹配的节点的所有父路径。
 * @param treeData The root nodes of the tree. 树形结构的根节点列表。
 * @param path The path to match. 要匹配的路径。
 * @returns An array of parent paths of the node in the tree that matches the given path. 与给定路径匹配的节点的所有父路径组成的数组。
 */
export function getAllParentPaths<T>(
  treeData: T[],
  path: string,
): string[] {
  const menuList = findFirstNodePath(treeData, n => n[path] === path) as Menu[];
  return menuList?.map(m => m.path);
}
