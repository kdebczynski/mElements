import React from "react";
import PropTypes from "prop-types";
import Header from "components/header/HeaderContainer";
import PageContent from "components/pageContent/PageContent";
import RepositoriesList from "components/repositories/list/ListContainer";
import Button from "components/formElements/button/Button";
import { routes } from "consts";
import style from "./style.scss";
import { parseQueryParams } from "utils/queryParams";

class SearchResults extends React.Component {

    state = {
        searchCriteria: {
            q: "",
            sort: "stars",
            order: "desc",
            page: 1,
            per_page: 20
        }
    }

    componentDidMount() {
        const encodedFavoutites = parseQueryParams(this.props.location.search);
        let searchCriteria = { ...this.state.searchCriteria };

        searchCriteria.q = `${encodedFavoutites.desc}+language:${encodedFavoutites.lang}`;

        this.setState({ searchCriteria });
        this.props.onSearchTriggered({ criteria: searchCriteria, reset: true });
    }

    onLoadMoreClick = () => {
        let searchCriteria = { ...this.state.searchCriteria };

        searchCriteria.page++;

        this.setState({ searchCriteria });
        this.props.onSearchTriggered({ criteria: searchCriteria });
    }

    render() {
        const { isProcessing, areDataAvailable } = this.props;

        return (
            <PageContent>
                <Header
                    title="Search Results"
                    route={ routes.MAIN }
                />
                <RepositoriesList />
                { areDataAvailable && 
                    <div className={ style.loadMoreWrapper }>
                        <Button
                            disabled={ isProcessing }
                            onClick={ this.onLoadMoreClick }
                        >
                            Load More
                        </Button>
                    </div>
                }
            </PageContent>
        );
    }
};

SearchResults.propTypes = {
    isProcessing: PropTypes.bool,
    areDataAvailable: PropTypes.bool,
    onSearchTriggered: PropTypes.func.isRequired
}

export default SearchResults;