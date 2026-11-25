import { categories as webCategories, type Category } from '@/data/tours';
import {
  AirplaneTiltIcon,
  BookOpenIcon,
  CompassIcon,
  LeafIcon,
  MountainsIcon,
  PathIcon,
  SparkleIcon,
  type Icon,
} from '@/components/icons';

export type CatName = Category | 'All' | 'Guides';

const ICON: Record<CatName, Icon> = {
  All: SparkleIcon,
  Trekking: PathIcon,
  'Peak Climbing': MountainsIcon,
  Culture: CompassIcon,
  Wildlife: LeafIcon,
  Adventure: SparkleIcon,
  'Heli Tours': AirplaneTiltIcon,
  Guides: BookOpenIcon,
};

/** Website categories, with Phosphor icons in place of emoji. */
export const categories = webCategories.map((c) => ({ name: c.name as CatName, icon: ICON[c.name as CatName] }));
