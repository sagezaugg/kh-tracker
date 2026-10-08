import { useParams } from 'react-router-dom';
import { isWorldRouteId } from '../data/worldIds';
import { Placeholder } from '../ui/Placeholder';
import { NotFoundRoute } from './NotFoundRoute';

export function WorldsRoute() {
  const { worldId } = useParams();
  if (!isWorldRouteId(worldId)) return <NotFoundRoute />;
  return <Placeholder>{`The ${worldId.toUpperCase()} checklist arrives in milestone 4.`}</Placeholder>;
}
