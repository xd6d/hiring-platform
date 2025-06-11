import React from 'react';
import {useTranslation} from 'react-i18next';
import {Link} from "react-router-dom";

const VacancyCardCompact = ({vacancy}) => {
    const {t} = useTranslation();

    return (
        <div className="border rounded-lg p-4 shadow-sm">
            <div className="flex justify-between items-start">
                <Link to={`/vacancies/${vacancy.id}`}>
                    <h2 className="text-xl font-semibold mb-2 text-blue-800 hover:underline">
                        {vacancy.name}
                    </h2>
                </Link>
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">
                  {t('applications')}: {vacancy.applied}
                </span>
            </div>

            <p className="text-sm text-gray-700 mb-2 line-clamp-3">{vacancy.description}</p>

            <div className="flex flex-wrap gap-2 text-sm mb-2">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {vacancy.work_format === 'OFFICE' && t('office')}
                    {vacancy.work_format === 'REMOTE' && t('remote')}
                    {vacancy.work_format === 'HYBRID' && t('hybrid')}
                </span>
                {vacancy.cities.map((city, idx) => (
                    <span key={idx} className="bg-gray-100 text-gray-800 px-2 py-1 rounded">
                        {city}
                      </span>
                ))}
            </div>

            <div className="flex flex-wrap gap-2 text-sm">
                {vacancy.tags.map((tag) => (
                    <span key={tag.id} className="bg-green-100 text-green-800 px-2 py-1 rounded">
                        {tag.name}
                      </span>
                ))}
            </div>
        </div>
    );
};

export default VacancyCardCompact;
