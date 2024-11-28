// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {Link} from 'react-router-dom';
import styled from 'styled-components';

import glyphMap, {CheckIcon} from '@mattermost/compass-icons/components';
import type {IconGlyphTypes} from '@mattermost/compass-icons/IconGlyphs';


export interface ProductMenuItemProps {
    destination: string;
    icon: IconGlyphTypes;
    text: React.ReactNode;
    active: boolean;
    onClick: () => void;

    tourTip?: React.ReactNode;
    id?: string;
}

// Width is reduced by 40px to account for the 20px padding on each side
// the <li> from 'MenuItem' adds. The total width remains 270px (current width) this way

// Read this part of the docs to find out how you can reorganize the
// CSS to avoid using '!important'.
// https://mui.com/material-ui/integrations/interoperability/#css-injection-order-2
const MenuItem = styled(Link)`
    && {
        text-decoration: none;
        color: inherit;
    }

    height: 40px;
    width: 270px !important;
    display: flex !important;
    align-items: center;
    position: relative;

    &:hover {
        text-decoration: none;
        color: inherit;
    }

    button {
        padding: 0 6px;
    }
`;

const MenuItemTextContainer = styled.div`
    margin-left: 8px;
    flex-grow: 1;
    font-weight: 600;
    font-size: 14px;
    line-height: 20px;
`;

const ProductMenuItem = ({icon, destination, text, active, onClick, tourTip, id}: ProductMenuItemProps): JSX.Element => {
    const ProductIcon = glyphMap[icon];

    return (
        <MenuItem
            to={destination}
            onClick={onClick}
            id={id}
            tabIndex={-1}
        >
            <ProductIcon
                size={24}
                color={'var(--button-bg)'}
            />
            <MenuItemTextContainer>
                {text}
            </MenuItemTextContainer>
            {active && (
                <CheckIcon
                    size={18}
                    color={'var(--button-bg)'}
                />
            )}
            {tourTip || null}
        </MenuItem>
    );
};

export default ProductMenuItem;
