import { Bookmark, ChevronRight } from 'lucide-react'
import { CategoryTabs, SearchBox } from '../components/common.jsx'

export function ServicesScreen({
  category,
  favorites,
  filteredServices,
  query,
  onBooking,
  onCategoryChange,
  onFavorite,
  onQueryChange,
}) {
  return (
    <section className="screen">
      <section className="page-title">
        <span className="eyebrow">Tabela de preços</span>
        <h1>Serviços Rotation</h1>
      </section>
      <SearchBox query={query} onQueryChange={onQueryChange} />
      <CategoryTabs category={category} onCategoryChange={onCategoryChange} />
      <div className="price-list">
        {filteredServices.map((service) => (
          <article className="price-row" key={service.id}>
            <img src={service.image} alt="" />
            <div>
              <h2>{service.name}</h2>
              <p>{service.duration} · {service.category}</p>
            </div>
            <strong>{service.price}</strong>
            <button
              className={favorites.includes(service.id) ? 'mini-icon-button active' : 'mini-icon-button'}
              type="button"
              aria-label={`Guardar ${service.name}`}
              onClick={() => onFavorite(service.id)}
            >
              <Bookmark size={17} fill={favorites.includes(service.id) ? 'currentColor' : 'none'} />
            </button>
            <button
              className="mini-icon-button"
              type="button"
              aria-label={`Marcar ${service.name}`}
              onClick={() => onBooking(service)}
            >
              <ChevronRight size={18} />
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}
